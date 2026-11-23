import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  ADMIN_ID,
  ADMIN_NAME,
  ADMIN_PASS,
  MAX_ACCOUNTS,
  PAY_AMT,
  PAY_HOUR,
  type Account,
  type Tx,
} from "@/lib/bank-constants";
import { getDb } from "@/lib/firebase";

export function explain(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (/permission|insufficient/i.test(msg)) return "مش قادر أوصل للحسابات — قواعد البنك بتمنع العملية";
  if (/unavailable|network|offline|failed to fetch/i.test(msg)) return "الاتصال ضعيف، حاول تاني";
  return msg || "حصلت مشكلة";
}

function asAccount(id: string, data: Record<string, unknown>): Account {
  return {
    id,
    name: String(data.name ?? "").trim(),
    balance: Number(data.balance ?? 0) || 0,
    pin: String(data.pin ?? ""),
    t: Number(data.t ?? 0) || 0,
  };
}

function asTx(id: string, data: Record<string, unknown>): Tx {
  return {
    id,
    from: String(data.from ?? ""),
    fromId: String(data.fromId ?? ""),
    to: String(data.to ?? ""),
    toId: String(data.toId ?? ""),
    amt: Number(data.amt ?? 0) || 0,
    note: String(data.note ?? ""),
    t: Number(data.t ?? 0) || 0,
  };
}

function assertPin(account: Account, attempt: string) {
  if (account.pin && account.pin !== attempt.trim()) {
    throw new Error(`اكتب كلمة سر ${account.name} الصح الأول`);
  }
}

function money(value: number, allowZero = false) {
  if (!Number.isFinite(value)) throw new Error("اكتب مبلغ صحيح");
  const amount = Math.floor(value);
  if (amount > 1_000_000_000) throw new Error("المبلغ كبير أوي");
  if (allowZero ? amount < 0 : amount <= 0) throw new Error("اكتب مبلغ صحيح");
  return amount;
}

function txId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function setInitialPin(accountId: string, pin: string) {
  const next = pin.trim();
  if (next.length < 3) throw new Error("اكتب كلمة سر (3 حروف على الأقل)");
  await updateDoc(doc(getDb(), "accounts", accountId), { pin: next });
}

export async function transfer(from: Account, toName: string, rawAmount: number) {
  const amt = money(rawAmount);
  const target = toName.trim();
  if (!target) throw new Error("اكتب اسم المستلم");
  const db = getDb();
  const snap = await getDocs(collection(db, "accounts"));
  const to = snap.docs.find(
    (row) => String(row.data().name ?? "").trim().toLowerCase() === target.toLowerCase(),
  );
  if (!to) throw new Error("مفيش حساب بالاسم ده");
  if (to.id === from.id) throw new Error("مينفعش تحوّل لنفسك");
  const id = txId();
  const tx: Tx = {
    id,
    from: from.name,
    fromId: from.id,
    to: String(to.data().name ?? target),
    toId: to.id,
    amt,
    note: "",
    t: Date.now(),
  };
  const batch = writeBatch(db);
  batch.update(doc(db, "accounts", from.id), { balance: increment(-amt) });
  batch.update(to.ref, { balance: increment(amt) });
  batch.set(doc(db, "tx", id), {
    from: tx.from,
    fromId: tx.fromId,
    to: tx.to,
    toId: tx.toId,
    amt,
    note: "",
    t: tx.t,
  });
  await batch.commit();
  return tx;
}

export async function createAccount(nameRaw: string, pinRaw: string, balanceRaw: number | null) {
  const name = nameRaw.trim();
  const pin = pinRaw.trim();
  if (!name) throw new Error("اكتب الاسم");
  if (name.length > 40) throw new Error("الاسم طويل أوي");
  const balance = balanceRaw == null || Number.isNaN(balanceRaw) ? 10000 : money(balanceRaw, true);
  const db = getDb();
  const snap = await getDocs(collection(db, "accounts"));
  if (snap.size >= MAX_ACCOUNTS) throw new Error("وصلنا للحد الأقصى 10 حسابات");
  if (snap.docs.some((row) => String(row.data().name ?? "").trim().toLowerCase() === name.toLowerCase())) {
    throw new Error("الاسم ده موجود بالفعل");
  }
  const id = `a${Date.now().toString(36)}`;
  await setDoc(doc(db, "accounts", id), { name, pin, balance, t: Date.now() });
  return name;
}

export async function addFunds(account: Account, rawAmount: number, noteRaw: string, pinAttempt: string) {
  assertPin(account, pinAttempt);
  const amt = money(rawAmount);
  const note = noteRaw.trim().slice(0, 140) || "إيداع من Bank Account";
  const db = getDb();
  const id = txId();
  const tx: Tx = {
    id,
    from: ADMIN_NAME,
    fromId: ADMIN_ID,
    to: account.name,
    toId: account.id,
    amt,
    note,
    t: Date.now(),
  };
  const batch = writeBatch(db);
  batch.update(doc(db, "accounts", account.id), { balance: increment(amt) });
  batch.set(doc(db, "tx", id), {
    from: tx.from,
    fromId: tx.fromId,
    to: tx.to,
    toId: tx.toId,
    amt,
    note,
    t: tx.t,
  });
  await batch.commit();
  return tx;
}

export async function withdrawFunds(account: Account, rawAmount: number, noteRaw: string, pinAttempt: string) {
  assertPin(account, pinAttempt);
  const amt = money(rawAmount);
  const note = noteRaw.trim().slice(0, 140) || "سحب بواسطة Bank Account";
  const db = getDb();
  const id = txId();
  const when = Date.now();
  const deducted = await runTransaction(db, async (transaction) => {
    const ref = doc(db, "accounts", account.id);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("الحساب مش موجود");
    const balance = Number(snap.data().balance || 0) || 0;
    const taken = Math.max(0, Math.min(amt, Math.max(0, balance)));
    if (taken <= 0) throw new Error("مفيش رصيد كفاية للسحب");
    transaction.update(ref, { balance: balance - taken });
    transaction.set(doc(db, "tx", id), {
      from: account.name,
      fromId: account.id,
      to: ADMIN_NAME,
      toId: ADMIN_ID,
      amt: taken,
      note,
      t: when,
    });
    return taken;
  });
  const tx: Tx = {
    id,
    from: account.name,
    fromId: account.id,
    to: ADMIN_NAME,
    toId: ADMIN_ID,
    amt: deducted,
    note,
    t: when,
  };
  return tx;
}

export async function setBalance(account: Account, rawAmount: number, pinAttempt: string) {
  assertPin(account, pinAttempt);
  const amount = money(rawAmount, true);
  await updateDoc(doc(getDb(), "accounts", account.id), { balance: amount });
}

export async function clearPin(account: Account, pinAttempt: string) {
  assertPin(account, pinAttempt);
  await updateDoc(doc(getDb(), "accounts", account.id), { pin: "" });
}

export async function removeAccount(account: Account, pinAttempt: string) {
  assertPin(account, pinAttempt);
  await deleteDoc(doc(getDb(), "accounts", account.id));
}

export async function payEveryone(rawAmount: number, noteRaw: string, password: string) {
  if (password !== ADMIN_PASS) throw new Error("باسورد البنك غلط");
  const amt = money(rawAmount);
  const note = noteRaw.trim().slice(0, 140) || "تحويل للكل";
  const db = getDb();
  const snap = await getDocs(collection(db, "accounts"));
  if (snap.empty) throw new Error("مفيش حسابات");
  const now = Date.now();
  const names: string[] = [];
  const ids: string[] = [];
  const batch = writeBatch(db);
  snap.docs.forEach((row, index) => {
    const name = String(row.data().name ?? "");
    names.push(name);
    const id = `all${now.toString(36)}_${row.id}`;
    ids.push(id);
    batch.update(row.ref, { balance: increment(amt) });
    batch.set(doc(db, "tx", id), {
      from: ADMIN_NAME,
      fromId: ADMIN_ID,
      to: name,
      toId: row.id,
      amt,
      note,
      t: now + index,
    });
  });
  await batch.commit();
  return { amount: amt, count: snap.size, note, createdAt: now, names, ids };
}

function cairoNow() {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date())
    .forEach((part) => {
      parts[part.type] = part.value;
    });
  return { y: +parts.year, m: +parts.month, d: +parts.day, h: +parts.hour };
}

async function claimPayout(key: string) {
  const db = getDb();
  const ref = doc(db, "settings", "payouts");
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const paid: Record<string, number> = {};
    if (snap.exists()) {
      const raw = snap.data().paid;
      if (raw && typeof raw === "object") {
        for (const [entry, value] of Object.entries(raw as Record<string, unknown>)) {
          paid[entry] = Number(value) || Date.now();
        }
      }
    }
    if (paid[key]) return false;
    paid[key] = Date.now();
    transaction.set(ref, { paid }, { merge: true });
    return true;
  });
}

async function unclaimPayout(key: string) {
  const db = getDb();
  const ref = doc(db, "settings", "payouts");
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;
    const raw = snap.data().paid;
    const paid: Record<string, number> = {};
    if (raw && typeof raw === "object") {
      for (const [entry, value] of Object.entries(raw as Record<string, unknown>)) {
        if (entry !== key) paid[entry] = Number(value) || 0;
      }
    }
    transaction.set(ref, { paid }, { merge: true });
  });
}

let payBusy = false;

export async function checkPayouts() {
  if (payBusy) return;
  payBusy = true;
  try {
    const now = cairoNow();
    const base = Date.UTC(now.y, now.m - 1, now.d);
    for (const shift of [-1, 0]) {
      const day = new Date(base + shift * 864e5);
      const weekday = day.getUTCDay();
      if (weekday !== 4 && weekday !== 5) continue;
      if (shift === 0 && now.h < PAY_HOUR) continue;
      const key = day.toISOString().slice(0, 10);
      const db = getDb();
      const accounts = await getDocs(collection(db, "accounts"));
      if (accounts.empty) continue;
      if (!(await claimPayout(key))) continue;
      try {
        const batch = writeBatch(db);
        const stamp = Date.now();
        const label = weekday === 4 ? "مرتب الخميس" : "مرتب الجمعة";
        accounts.docs.forEach((row, index) => {
          const balance = Number(row.data().balance || 0) || 0;
          const debt = balance < 0 ? -balance : 0;
          const note = debt
            ? `${label} — خصم دين ${debt.toLocaleString("en-US")} = صافي ${(PAY_AMT - debt).toLocaleString("en-US")} من ${PAY_AMT.toLocaleString("en-US")}`
            : label;
          batch.update(row.ref, { balance: increment(PAY_AMT) });
          batch.set(doc(db, "tx", `pay${key}_${row.id}`), {
            from: ADMIN_NAME,
            fromId: ADMIN_ID,
            to: String(row.data().name ?? ""),
            toId: row.id,
            amt: PAY_AMT,
            note,
            t: stamp + index,
          });
        });
        await batch.commit();
      } catch (error) {
        await unclaimPayout(key).catch(() => undefined);
        throw error;
      }
    }
  } catch (error) {
    console.error("payout", error);
  } finally {
    payBusy = false;
  }
}

let listeners = 0;
let timer: ReturnType<typeof setInterval> | null = null;

export function subscribeBank(onData: (state: { accounts: Account[]; txs: Tx[] }) => void, onError: (message: string) => void) {
  const db = getDb();
  let accounts: Account[] | null = null;
  let txs: Tx[] | null = null;
  const emit = () => {
    if (!accounts || !txs) return;
    onData({ accounts, txs });
  };
  const unsubAccounts = onSnapshot(
    collection(db, "accounts"),
    (snap) => {
      accounts = snap.docs
        .map((row) => asAccount(row.id, row.data() as Record<string, unknown>))
        .sort((a, b) => a.t - b.t);
      emit();
    },
    (error) => onError(explain(error)),
  );
  const unsubTx = onSnapshot(
    collection(db, "tx"),
    (snap) => {
      txs = snap.docs
        .map((row) => asTx(row.id, row.data() as Record<string, unknown>))
        .sort((a, b) => b.t - a.t);
      emit();
    },
    (error) => onError(explain(error)),
  );
  listeners += 1;
  if (listeners === 1) {
    void checkPayouts();
    timer = setInterval(() => void checkPayouts(), 60_000);
  }
  return () => {
    unsubAccounts();
    unsubTx();
    listeners = Math.max(0, listeners - 1);
    if (listeners === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export type Thread = {
  id: string;
  kind: "dm" | "group";
  title: string;
  members: string[];
  memberNames: Record<string, string>;
  lastText: string;
  lastAt: number;
  lastFromId: string;
};

export type ChatMessage = {
  id: string;
  fromId: string;
  fromName: string;
  text: string;
  t: number;
};

function asThread(id: string, data: Record<string, unknown>): Thread {
  const names = data.memberNames;
  const memberNames: Record<string, string> = {};
  if (names && typeof names === "object") {
    for (const [key, value] of Object.entries(names as Record<string, unknown>)) {
      memberNames[key] = String(value ?? "");
    }
  }
  return {
    id,
    kind: data.kind === "group" ? "group" : "dm",
    title: String(data.title ?? ""),
    members: Array.isArray(data.members) ? data.members.map((item) => String(item)) : [],
    memberNames,
    lastText: String(data.lastText ?? ""),
    lastAt: Number(data.lastAt ?? 0) || 0,
    lastFromId: String(data.lastFromId ?? ""),
  };
}

export function threadLabel(thread: Thread, myId: string) {
  if (thread.kind === "group") return thread.title || "جروب";
  const other = thread.members.find((id) => id !== myId);
  if (!other) return "محادثة";
  return thread.memberNames[other] || other;
}

export async function openDirect(meId: string, meName: string, otherId: string, otherName: string) {
  if (!meId || !otherId || meId === otherId) throw new Error("اختار شخص تاني");
  const members = [meId, otherId].sort();
  const id = `dm_${members.join("__")}`;
  const ref = doc(getDb(), "threads", id);
  await runTransaction(getDb(), async (transaction) => {
    const snap = await transaction.get(ref);
    const names = { [meId]: meName, [otherId]: otherName };
    if (!snap.exists()) {
      transaction.set(ref, {
        kind: "dm",
        title: "",
        members,
        memberNames: names,
        createdBy: meId,
        createdAt: Date.now(),
        lastText: "",
        lastAt: Date.now(),
        lastFromId: "",
      });
      return;
    }
    const prev = snap.data().memberNames;
    const memberNames =
      prev && typeof prev === "object" ? { ...(prev as Record<string, string>), ...names } : names;
    transaction.set(ref, { memberNames }, { merge: true });
  });
  return id;
}

export async function createGroup(titleRaw: string, people: { id: string; name: string }[]) {
  const title = titleRaw.trim().slice(0, 40);
  if (!title) throw new Error("اكتب اسم الجروب");
  if (!people.length) throw new Error("اختار شخص واحد على الأقل");
  const members = Array.from(new Set([ADMIN_ID, ...people.map((person) => person.id)]));
  const memberNames: Record<string, string> = { [ADMIN_ID]: ADMIN_NAME };
  for (const person of people) memberNames[person.id] = person.name;
  const id = `g${Date.now().toString(36)}`;
  await setDoc(doc(getDb(), "threads", id), {
    kind: "group",
    title,
    members,
    memberNames,
    createdBy: ADMIN_ID,
    createdAt: Date.now(),
    lastText: "",
    lastAt: Date.now(),
    lastFromId: "",
  });
  return id;
}

export async function sendChat(threadId: string, fromId: string, fromName: string, raw: string) {
  const text = raw.trim().slice(0, 500);
  if (!text) throw new Error("اكتب الرسالة");
  const db = getDb();
  const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const t = Date.now();
  const batch = writeBatch(db);
  batch.set(doc(db, "threads", threadId, "messages", id), { fromId, fromName, text, t });
  batch.update(doc(db, "threads", threadId), { lastText: text, lastAt: t, lastFromId: fromId });
  await batch.commit();
}

export function subscribeThreads(
  actorId: string,
  onData: (threads: Thread[]) => void,
  onError: (message: string) => void,
) {
  const threadsQuery = query(collection(getDb(), "threads"), where("members", "array-contains", actorId));
  return onSnapshot(
    threadsQuery,
    (snap) => {
      const threads = snap.docs
        .map((row) => asThread(row.id, row.data() as Record<string, unknown>))
        .sort((a, b) => b.lastAt - a.lastAt);
      onData(threads);
    },
    (error) => onError(explain(error)),
  );
}

export function subscribeMessages(
  threadId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getDb(), "threads", threadId, "messages"),
    (snap) => {
      const messages: ChatMessage[] = snap.docs
        .map((row) => {
          const data = row.data() as Record<string, unknown>;
          return {
            id: row.id,
            fromId: String(data.fromId ?? ""),
            fromName: String(data.fromName ?? ""),
            text: String(data.text ?? ""),
            t: Number(data.t ?? 0) || 0,
          };
        })
        .sort((a, b) => a.t - b.t);
      onData(messages);
    },
    (error) => onError(explain(error)),
  );
}
