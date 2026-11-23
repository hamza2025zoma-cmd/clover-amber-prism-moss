import { o as __toESM } from "../_runtime.mjs";
import { G as require_jsx_runtime, K as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as BANK_LOGIN_ID, c as applyTheme, d as savedTheme, f as txReceipt, l as formatMoney, m as Background, n as ADMIN_ID, o as PAY_AMT, p as txTitle, r as ADMIN_NAME, s as THEMES, u as formatWhen } from "./routes-CrhUh_M3.mjs";
import { a as Send, c as LogOut, d as EyeOff, f as Download, i as Share2, l as Landmark, m as ArrowRight, n as Users, o as Palette, p as Bell, s as MessageCircle, t as X, u as Eye } from "../_libs/lucide-react.mjs";
import { o as getApps, s as initializeApp } from "../_libs/@firebase/app+[...].mjs";
import { a as runTransaction, c as where, d as doc, f as getFirestore, i as query, l as writeBatch, n as getDocs, o as setDoc, p as increment, r as onSnapshot, s as updateDoc, t as deleteDoc, u as collection } from "../_libs/@firebase/firestore+[...].mjs";
import "../_libs/firebase.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bank-app-DVI8iED5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var firebaseConfig = {
	apiKey: "AIzaSyBw2BXQ0bubipE0PnTbHBa128zBV8EJPpc",
	authDomain: "bank-teta.firebaseapp.com",
	projectId: "bank-teta",
	storageBucket: "bank-teta.firebasestorage.app",
	messagingSenderId: "185129169349",
	appId: "1:185129169349:web:192fa3c7ba7fbd09ba5bac"
};
function getDb() {
	const app = getApps()[0] ?? initializeApp(firebaseConfig);
	return getFirestore(app);
}
function explain(error) {
	const msg = error instanceof Error ? error.message : String(error ?? "");
	if (/permission|insufficient/i.test(msg)) return "مش قادر أوصل للحسابات — قواعد البنك بتمنع العملية";
	if (/unavailable|network|offline|failed to fetch/i.test(msg)) return "الاتصال ضعيف، حاول تاني";
	return msg || "حصلت مشكلة";
}
function asAccount(id, data) {
	return {
		id,
		name: String(data.name ?? "").trim(),
		balance: Number(data.balance ?? 0) || 0,
		pin: String(data.pin ?? ""),
		t: Number(data.t ?? 0) || 0
	};
}
function asTx(id, data) {
	return {
		id,
		from: String(data.from ?? ""),
		fromId: String(data.fromId ?? ""),
		to: String(data.to ?? ""),
		toId: String(data.toId ?? ""),
		amt: Number(data.amt ?? 0) || 0,
		note: String(data.note ?? ""),
		t: Number(data.t ?? 0) || 0
	};
}
function assertPin(account, attempt) {
	if (account.pin && account.pin !== attempt.trim()) throw new Error(`اكتب كلمة سر ${account.name} الصح الأول`);
}
function money(value, allowZero = false) {
	if (!Number.isFinite(value)) throw new Error("اكتب مبلغ صحيح");
	const amount = Math.floor(value);
	if (amount > 1e9) throw new Error("المبلغ كبير أوي");
	if (allowZero ? amount < 0 : amount <= 0) throw new Error("اكتب مبلغ صحيح");
	return amount;
}
function txId() {
	return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
async function setInitialPin(accountId, pin) {
	const next = pin.trim();
	if (next.length < 3) throw new Error("اكتب كلمة سر (3 حروف على الأقل)");
	await updateDoc(doc(getDb(), "accounts", accountId), { pin: next });
}
async function transfer(from, toName, rawAmount) {
	const amt = money(rawAmount);
	const target = toName.trim();
	if (!target) throw new Error("اكتب اسم المستلم");
	const db = getDb();
	const to = (await getDocs(collection(db, "accounts"))).docs.find((row) => String(row.data().name ?? "").trim().toLowerCase() === target.toLowerCase());
	if (!to) throw new Error("مفيش حساب بالاسم ده");
	if (to.id === from.id) throw new Error("مينفعش تحوّل لنفسك");
	const id = txId();
	const tx = {
		id,
		from: from.name,
		fromId: from.id,
		to: String(to.data().name ?? target),
		toId: to.id,
		amt,
		note: "",
		t: Date.now()
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
		t: tx.t
	});
	await batch.commit();
	return tx;
}
async function createAccount(nameRaw, pinRaw, balanceRaw) {
	const name = nameRaw.trim();
	const pin = pinRaw.trim();
	if (!name) throw new Error("اكتب الاسم");
	if (name.length > 40) throw new Error("الاسم طويل أوي");
	const balance = balanceRaw == null || Number.isNaN(balanceRaw) ? 1e4 : money(balanceRaw, true);
	const db = getDb();
	const snap = await getDocs(collection(db, "accounts"));
	if (snap.size >= 10) throw new Error("وصلنا للحد الأقصى 10 حسابات");
	if (snap.docs.some((row) => String(row.data().name ?? "").trim().toLowerCase() === name.toLowerCase())) throw new Error("الاسم ده موجود بالفعل");
	const id = `a${Date.now().toString(36)}`;
	await setDoc(doc(db, "accounts", id), {
		name,
		pin,
		balance,
		t: Date.now()
	});
	return name;
}
async function addFunds(account, rawAmount, noteRaw, pinAttempt) {
	assertPin(account, pinAttempt);
	const amt = money(rawAmount);
	const note = noteRaw.trim().slice(0, 140) || "إيداع من Bank Account";
	const db = getDb();
	const id = txId();
	const tx = {
		id,
		from: ADMIN_NAME,
		fromId: ADMIN_ID,
		to: account.name,
		toId: account.id,
		amt,
		note,
		t: Date.now()
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
		t: tx.t
	});
	await batch.commit();
	return tx;
}
async function withdrawFunds(account, rawAmount, noteRaw, pinAttempt) {
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
			t: when
		});
		return taken;
	});
	return {
		id,
		from: account.name,
		fromId: account.id,
		to: ADMIN_NAME,
		toId: ADMIN_ID,
		amt: deducted,
		note,
		t: when
	};
}
async function setBalance(account, rawAmount, pinAttempt) {
	assertPin(account, pinAttempt);
	const amount = money(rawAmount, true);
	await updateDoc(doc(getDb(), "accounts", account.id), { balance: amount });
}
async function clearPin(account, pinAttempt) {
	assertPin(account, pinAttempt);
	await updateDoc(doc(getDb(), "accounts", account.id), { pin: "" });
}
async function removeAccount(account, pinAttempt) {
	assertPin(account, pinAttempt);
	await deleteDoc(doc(getDb(), "accounts", account.id));
}
async function payEveryone(rawAmount, noteRaw, password) {
	if (password !== "Bank@1628") throw new Error("باسورد البنك غلط");
	const amt = money(rawAmount);
	const note = noteRaw.trim().slice(0, 140) || "تحويل للكل";
	const db = getDb();
	const snap = await getDocs(collection(db, "accounts"));
	if (snap.empty) throw new Error("مفيش حسابات");
	const now = Date.now();
	const names = [];
	const ids = [];
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
			t: now + index
		});
	});
	await batch.commit();
	return {
		amount: amt,
		count: snap.size,
		note,
		createdAt: now,
		names,
		ids
	};
}
function cairoNow() {
	const parts = {};
	new Intl.DateTimeFormat("en-GB", {
		timeZone: "Africa/Cairo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hourCycle: "h23"
	}).formatToParts(/* @__PURE__ */ new Date()).forEach((part) => {
		parts[part.type] = part.value;
	});
	return {
		y: +parts.year,
		m: +parts.month,
		d: +parts.day,
		h: +parts.hour
	};
}
async function claimPayout(key) {
	const db = getDb();
	const ref = doc(db, "settings", "payouts");
	return runTransaction(db, async (transaction) => {
		const snap = await transaction.get(ref);
		const paid = {};
		if (snap.exists()) {
			const raw = snap.data().paid;
			if (raw && typeof raw === "object") for (const [entry, value] of Object.entries(raw)) paid[entry] = Number(value) || Date.now();
		}
		if (paid[key]) return false;
		paid[key] = Date.now();
		transaction.set(ref, { paid }, { merge: true });
		return true;
	});
}
async function unclaimPayout(key) {
	const db = getDb();
	const ref = doc(db, "settings", "payouts");
	await runTransaction(db, async (transaction) => {
		const snap = await transaction.get(ref);
		if (!snap.exists()) return;
		const raw = snap.data().paid;
		const paid = {};
		if (raw && typeof raw === "object") {
			for (const [entry, value] of Object.entries(raw)) if (entry !== key) paid[entry] = Number(value) || 0;
		}
		transaction.set(ref, { paid }, { merge: true });
	});
}
var payBusy = false;
async function checkPayouts() {
	if (payBusy) return;
	payBusy = true;
	try {
		const now = cairoNow();
		const base = Date.UTC(now.y, now.m - 1, now.d);
		for (const shift of [-1, 0]) {
			const day = new Date(base + shift * 864e5);
			const weekday = day.getUTCDay();
			if (weekday !== 4 && weekday !== 5) continue;
			if (shift === 0 && now.h < 11) continue;
			const key = day.toISOString().slice(0, 10);
			const db = getDb();
			const accounts = await getDocs(collection(db, "accounts"));
			if (accounts.empty) continue;
			if (!await claimPayout(key)) continue;
			try {
				const batch = writeBatch(db);
				const stamp = Date.now();
				const label = weekday === 4 ? "مرتب الخميس" : "مرتب الجمعة";
				accounts.docs.forEach((row, index) => {
					const balance = Number(row.data().balance || 0) || 0;
					const debt = balance < 0 ? -balance : 0;
					const note = debt ? `${label} — خصم دين ${debt.toLocaleString("en-US")} = صافي ${(PAY_AMT - debt).toLocaleString("en-US")} من ${PAY_AMT.toLocaleString("en-US")}` : label;
					batch.update(row.ref, { balance: increment(PAY_AMT) });
					batch.set(doc(db, "tx", `pay${key}_${row.id}`), {
						from: ADMIN_NAME,
						fromId: ADMIN_ID,
						to: String(row.data().name ?? ""),
						toId: row.id,
						amt: PAY_AMT,
						note,
						t: stamp + index
					});
				});
				await batch.commit();
			} catch (error) {
				await unclaimPayout(key).catch(() => void 0);
				throw error;
			}
		}
	} catch (error) {
		console.error("payout", error);
	} finally {
		payBusy = false;
	}
}
var listeners = 0;
var timer = null;
function subscribeBank(onData, onError) {
	const db = getDb();
	let accounts = null;
	let txs = null;
	const emit = () => {
		if (!accounts || !txs) return;
		onData({
			accounts,
			txs
		});
	};
	const unsubAccounts = onSnapshot(collection(db, "accounts"), (snap) => {
		accounts = snap.docs.map((row) => asAccount(row.id, row.data())).sort((a, b) => a.t - b.t);
		emit();
	}, (error) => onError(explain(error)));
	const unsubTx = onSnapshot(collection(db, "tx"), (snap) => {
		txs = snap.docs.map((row) => asTx(row.id, row.data())).sort((a, b) => b.t - a.t);
		emit();
	}, (error) => onError(explain(error)));
	listeners += 1;
	if (listeners === 1) {
		checkPayouts();
		timer = setInterval(() => void checkPayouts(), 6e4);
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
function asThread(id, data) {
	const names = data.memberNames;
	const memberNames = {};
	if (names && typeof names === "object") for (const [key, value] of Object.entries(names)) memberNames[key] = String(value ?? "");
	return {
		id,
		kind: data.kind === "group" ? "group" : "dm",
		title: String(data.title ?? ""),
		members: Array.isArray(data.members) ? data.members.map((item) => String(item)) : [],
		memberNames,
		lastText: String(data.lastText ?? ""),
		lastAt: Number(data.lastAt ?? 0) || 0,
		lastFromId: String(data.lastFromId ?? "")
	};
}
function threadLabel(thread, myId) {
	if (thread.kind === "group") return thread.title || "جروب";
	const other = thread.members.find((id) => id !== myId);
	if (!other) return "محادثة";
	return thread.memberNames[other] || other;
}
async function openDirect(meId, meName, otherId, otherName) {
	if (!meId || !otherId || meId === otherId) throw new Error("اختار شخص تاني");
	const members = [meId, otherId].sort();
	const id = `dm_${members.join("__")}`;
	const ref = doc(getDb(), "threads", id);
	await runTransaction(getDb(), async (transaction) => {
		const snap = await transaction.get(ref);
		const names = {
			[meId]: meName,
			[otherId]: otherName
		};
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
				lastFromId: ""
			});
			return;
		}
		const prev = snap.data().memberNames;
		const memberNames = prev && typeof prev === "object" ? {
			...prev,
			...names
		} : names;
		transaction.set(ref, { memberNames }, { merge: true });
	});
	return id;
}
async function createGroup(titleRaw, people) {
	const title = titleRaw.trim().slice(0, 40);
	if (!title) throw new Error("اكتب اسم الجروب");
	if (!people.length) throw new Error("اختار شخص واحد على الأقل");
	const members = Array.from(/* @__PURE__ */ new Set([ADMIN_ID, ...people.map((person) => person.id)]));
	const memberNames = { [ADMIN_ID]: ADMIN_NAME };
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
		lastFromId: ""
	});
	return id;
}
async function sendChat(threadId, fromId, fromName, raw) {
	const text = raw.trim().slice(0, 500);
	if (!text) throw new Error("اكتب الرسالة");
	const db = getDb();
	const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
	const t = Date.now();
	const batch = writeBatch(db);
	batch.set(doc(db, "threads", threadId, "messages", id), {
		fromId,
		fromName,
		text,
		t
	});
	batch.update(doc(db, "threads", threadId), {
		lastText: text,
		lastAt: t,
		lastFromId: fromId
	});
	await batch.commit();
}
function subscribeThreads(actorId, onData, onError) {
	const threadsQuery = query(collection(getDb(), "threads"), where("members", "array-contains", actorId));
	return onSnapshot(threadsQuery, (snap) => {
		onData(snap.docs.map((row) => asThread(row.id, row.data())).sort((a, b) => b.lastAt - a.lastAt));
	}, (error) => onError(explain(error)));
}
function subscribeMessages(threadId, onData, onError) {
	return onSnapshot(collection(getDb(), "threads", threadId, "messages"), (snap) => {
		onData(snap.docs.map((row) => {
			const data = row.data();
			return {
				id: row.id,
				fromId: String(data.fromId ?? ""),
				fromName: String(data.fromName ?? ""),
				text: String(data.text ?? ""),
				t: Number(data.t ?? 0) || 0
			};
		}).sort((a, b) => a.t - b.t));
	}, (error) => onError(explain(error)));
}
var SEEN_KEY = "teta_chat_seen";
function readSeen() {
	try {
		const raw = localStorage.getItem(SEEN_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}
function ChatPanel({ actorId, actorName, admin, people, onUnread }) {
	const [threads, setThreads] = (0, import_react.useState)([]);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)("list");
	const [text, setText] = (0, import_react.useState)("");
	const [groupTitle, setGroupTitle] = (0, import_react.useState)("");
	const [picked, setPicked] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [seen, setSeen] = (0, import_react.useState)(readSeen);
	const scroller = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => subscribeThreads(actorId, setThreads, setError), [actorId]);
	(0, import_react.useEffect)(() => {
		if (!openId) return;
		return subscribeMessages(openId, setMessages, setError);
	}, [openId]);
	(0, import_react.useEffect)(() => {
		const count = threads.filter((thread) => thread.lastText && thread.lastFromId && thread.lastFromId !== actorId && thread.lastAt > (seen[thread.id] || 0)).length;
		onUnread(count);
	}, [
		threads,
		seen,
		actorId,
		onUnread
	]);
	(0, import_react.useEffect)(() => {
		if (!openId) return;
		const thread = threads.find((item) => item.id === openId);
		if (!thread || (seen[openId] || 0) >= thread.lastAt) return;
		const next = {
			...seen,
			[openId]: thread.lastAt
		};
		localStorage.setItem(SEEN_KEY, JSON.stringify(next));
		setSeen(next);
	}, [
		openId,
		threads,
		seen
	]);
	(0, import_react.useEffect)(() => {
		const el = scroller.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages, openId]);
	const current = threads.find((thread) => thread.id === openId) ?? null;
	function remember(id, at) {
		setSeen((prev) => {
			const next = {
				...prev,
				[id]: Math.max(prev[id] || 0, at, Date.now())
			};
			localStorage.setItem(SEEN_KEY, JSON.stringify(next));
			return next;
		});
	}
	async function startDirect(person) {
		setBusy(true);
		setError("");
		try {
			const id = await openDirect(actorId, actorName, person.id, person.name);
			setOpenId(id);
			setMode("thread");
			setText("");
			remember(id, Date.now());
		} catch (err) {
			setError(explain(err));
		} finally {
			setBusy(false);
		}
	}
	async function startGroup() {
		setBusy(true);
		setError("");
		try {
			const members = people.filter((person) => picked.includes(person.id));
			const id = await createGroup(groupTitle, members);
			setOpenId(id);
			setMode("thread");
			setGroupTitle("");
			setPicked([]);
			remember(id, Date.now());
		} catch (err) {
			setError(explain(err));
		} finally {
			setBusy(false);
		}
	}
	async function onSend(event) {
		event.preventDefault();
		if (!openId || busy) return;
		setBusy(true);
		setError("");
		try {
			await sendChat(openId, actorId, actorName, text);
			setText("");
		} catch (err) {
			setError(explain(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "glass chat",
		children: [
			mode === "thread" && current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "chat-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "icon-btn",
						type: "button",
						"aria-label": "رجوع",
						onClick: () => setMode("list"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "icon" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tx-copy",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: threadLabel(current, actorId) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "muted",
							children: current.kind === "group" ? `${current.members.length} أعضاء · رسائل بس` : "رسائل بس"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "msg-list",
					ref: scroller,
					children: [messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted center",
						children: "لسه مفيش رسائل. ابدأ أنت."
					}) : null, messages.map((message) => {
						const mine = message.fromId === actorId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: mine ? "bubble mine" : "bubble theirs",
							children: [
								current.kind === "group" && !mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: message.fromName }) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message.text }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "muted",
									children: formatWhen(message.t)
								})
							]
						}, message.id);
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "composer",
					onSubmit: onSend,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						value: text,
						maxLength: 500,
						placeholder: "اكتب رسالة",
						onChange: (event) => setText(event.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "icon-btn",
						type: "submit",
						"aria-label": "إرسال",
						disabled: busy || !text.trim(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "icon" })
					})]
				})
			] }) : null,
			mode === "list" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "section-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "الشات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "muted",
						children: "رسائل بس"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "acts",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: () => setMode("pick"),
						children: "رسالة جديدة"
					}), admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "btn",
						type: "button",
						onClick: () => setMode("group"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "icon" }), " جروب"]
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "thread-list",
					style: { marginTop: 12 },
					children: [threads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "مفيش محادثات. ابعت لأي حد في العيلة."
					}) : null, threads.map((thread) => {
						const unread = thread.lastText && thread.lastFromId && thread.lastFromId !== actorId && thread.lastAt > (seen[thread.id] || 0);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "thread",
							type: "button",
							onClick: () => {
								setOpenId(thread.id);
								setMode("thread");
								remember(thread.id, thread.lastAt);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "thread-copy",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [thread.kind === "group" ? "جروب · " : "", threadLabel(thread, actorId)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "muted",
									children: thread.lastText || "لسه مفيش رسائل"
								})]
							}), unread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "amt in",
								children: "جديد"
							}) : null]
						}, thread.id);
					})]
				})
			] }) : null,
			mode === "pick" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "chat-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "icon-btn",
					type: "button",
					"aria-label": "رجوع",
					onClick: () => setMode("list"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "icon" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "ابعت لمين؟" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "picker",
				children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn",
					type: "button",
					disabled: busy,
					onClick: () => void startDirect(person),
					children: person.name
				}, person.id))
			})] }) : null,
			mode === "group" && admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "chat-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "icon-btn",
						type: "button",
						"aria-label": "رجوع",
						onClick: () => setMode("list"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "icon" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "جروب جديد" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					value: groupTitle,
					placeholder: "اسم الجروب",
					maxLength: 40,
					onChange: (event) => setGroupTitle(event.target.value)
				}),
				people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "check",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: picked.includes(person.id),
						onChange: () => setPicked((prev) => prev.includes(person.id) ? prev.filter((id) => id !== person.id) : [...prev, person.id])
					}), person.name]
				}, person.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "btn-main",
					type: "button",
					disabled: busy,
					onClick: () => void startGroup(),
					children: "إنشاء الجروب"
				})
			] }) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "flash no",
				children: error
			}) : null
		]
	});
}
var INK = {
	purple: {
		a: "#2e1065",
		b: "#5b21b6",
		c: "#c4b5fd",
		ink: "#ffffff",
		gold: "#f5d77a",
		soft: "rgba(255,255,255,.78)"
	},
	classic: {
		a: "#1b1464",
		b: "#0b6e8a",
		c: "#67e8f9",
		ink: "#ffffff",
		gold: "#fde68a",
		soft: "rgba(255,255,255,.78)"
	},
	aurora: {
		a: "#0b1020",
		b: "#0f766e",
		c: "#818cf8",
		ink: "#ffffff",
		gold: "#a7f3d0",
		soft: "rgba(255,255,255,.75)"
	},
	ocean: {
		a: "#03045e",
		b: "#0077b6",
		c: "#90e0ef",
		ink: "#ffffff",
		gold: "#caf0f8",
		soft: "rgba(255,255,255,.8)"
	},
	candy: {
		a: "#9d174d",
		b: "#fb7185",
		c: "#fdba74",
		ink: "#3b2a4a",
		gold: "#9d174d",
		soft: "rgba(59,42,74,.72)"
	},
	space: {
		a: "#05010f",
		b: "#4c1d95",
		c: "#2563eb",
		ink: "#f5f3ff",
		gold: "#c4b5fd",
		soft: "rgba(245,243,255,.75)"
	},
	gold: {
		a: "#0b0b0b",
		b: "#3f2e0b",
		c: "#b8860b",
		ink: "#f3ead2",
		gold: "#f5d77a",
		soft: "rgba(243,234,210,.75)"
	},
	sky: {
		a: "#0369a1",
		b: "#38bdf8",
		c: "#f0f9ff",
		ink: "#0c2d48",
		gold: "#0369a1",
		soft: "rgba(12,45,72,.7)"
	},
	neon: {
		a: "#07060f",
		b: "#3b0764",
		c: "#00e5ff",
		ink: "#ffffff",
		gold: "#00e5ff",
		soft: "rgba(255,255,255,.75)"
	},
	sunset: {
		a: "#4a1942",
		b: "#c2410c",
		c: "#fbbf24",
		ink: "#ffffff",
		gold: "#fff7ed",
		soft: "rgba(255,255,255,.8)"
	}
};
function round(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
}
function wrap(ctx, text, max) {
	const words = text.split(/\s+/).filter(Boolean);
	const lines = [];
	let line = "";
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (ctx.measureText(next).width > max && line) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines.slice(0, 3);
}
async function readyFont() {
	try {
		await document.fonts.load("800 86px Cairo");
		await document.fonts.load("700 40px Cairo");
		await document.fonts.load("600 30px Cairo");
	} catch {}
}
async function renderReceiptBlob(model, themeId) {
	await readyFont();
	const theme = INK[themeId in INK ? themeId : "purple"];
	const canvas = document.createElement("canvas");
	canvas.width = 1080;
	canvas.height = 1440;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("مش قادر أرسم الإيصال");
	const bg = ctx.createLinearGradient(0, 0, 1080, 1440);
	bg.addColorStop(0, theme.a);
	bg.addColorStop(.55, theme.b);
	bg.addColorStop(1, theme.c);
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, 1080, 1440);
	ctx.fillStyle = "rgba(255,255,255,.14)";
	ctx.beginPath();
	ctx.arc(920, 180, 220, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(140, 1240, 260, 0, Math.PI * 2);
	ctx.fill();
	round(ctx, 72, 88, 936, 1264, 56);
	ctx.fillStyle = "rgba(255,255,255,.16)";
	ctx.fill();
	ctx.strokeStyle = "rgba(255,255,255,.48)";
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.direction = "rtl";
	ctx.textAlign = "center";
	ctx.fillStyle = theme.ink;
	ctx.font = "700 34px Cairo, Tahoma, sans-serif";
	ctx.fillText("بنك تيته امال الدولي", 540, 190);
	ctx.fillStyle = theme.gold;
	ctx.font = "700 28px Cairo, Tahoma, sans-serif";
	ctx.fillText(model.kind === "all" ? "إيصال تحويل للكل" : "إيصال تحويل", 540, 246);
	ctx.fillStyle = theme.ink;
	ctx.font = "800 92px Cairo, Tahoma, sans-serif";
	const amount = model.kind === "all" ? model.amount : model.amount;
	ctx.fillText(`${formatMoney(amount)} جنيه`, 540, 420);
	ctx.font = "600 30px Cairo, Tahoma, sans-serif";
	ctx.fillStyle = theme.soft;
	ctx.fillText(model.kind === "all" ? "لكل حساب" : "مبلغ التحويل", 540, 470);
	round(ctx, 128, 530, 824, model.kind === "all" ? 430 : 390, 36);
	ctx.fillStyle = "rgba(0,0,0,.16)";
	ctx.fill();
	ctx.textAlign = "center";
	ctx.fillStyle = theme.soft;
	ctx.font = "600 26px Cairo, Tahoma, sans-serif";
	if (model.kind === "one") {
		ctx.fillText("من", 540, 600);
		ctx.fillStyle = theme.ink;
		ctx.font = "800 48px Cairo, Tahoma, sans-serif";
		ctx.fillText(model.fromName, 540, 670);
		ctx.fillStyle = theme.gold;
		ctx.font = "700 36px Cairo, Tahoma, sans-serif";
		ctx.fillText("↓", 540, 730);
		ctx.fillStyle = theme.soft;
		ctx.font = "600 26px Cairo, Tahoma, sans-serif";
		ctx.fillText("إلى", 540, 790);
		ctx.fillStyle = theme.ink;
		ctx.font = "800 48px Cairo, Tahoma, sans-serif";
		ctx.fillText(model.toName, 540, 860);
	} else {
		ctx.fillText("المرسل", 540, 600);
		ctx.fillStyle = theme.ink;
		ctx.font = "800 48px Cairo, Tahoma, sans-serif";
		ctx.fillText("Bank Account", 540, 670);
		ctx.fillStyle = theme.soft;
		ctx.font = "600 28px Cairo, Tahoma, sans-serif";
		ctx.fillText(`${formatMoney(model.count)} حسابات`, 540, 750);
		ctx.fillText(`الإجمالي ${formatMoney(model.amount * model.count)} جنيه`, 540, 810);
		ctx.font = "600 26px Cairo, Tahoma, sans-serif";
		const names = model.names.join(" · ");
		ctx.fillStyle = theme.ink;
		wrap(ctx, names, 720).forEach((line, index) => ctx.fillText(line, 540, 880 + index * 40));
	}
	let y = model.kind === "all" ? 1040 : 1e3;
	if (model.note) {
		ctx.fillStyle = theme.soft;
		ctx.font = "600 26px Cairo, Tahoma, sans-serif";
		ctx.fillText("السبب", 540, y);
		ctx.fillStyle = theme.ink;
		ctx.font = "700 32px Cairo, Tahoma, sans-serif";
		const noteLines = wrap(ctx, model.note, 760);
		noteLines.forEach((line, index) => ctx.fillText(line, 540, y + 52 + index * 42));
		y += 52 + noteLines.length * 42 + 20;
	}
	ctx.fillStyle = theme.soft;
	ctx.font = "600 26px Cairo, Tahoma, sans-serif";
	ctx.fillText(formatWhen(model.createdAt), 540, Math.min(y + 36, 1280));
	const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
	if (!blob) throw new Error("مش قادر أحفظ صورة التحويل");
	return blob;
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function shareBlob(blob, filename, text) {
	const file = new File([blob], filename, { type: "image/png" });
	if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
		await navigator.share({
			files: [file],
			text,
			title: "إيصال تحويل"
		});
		return "shared";
	}
	return "unsupported";
}
var SESSION_KEY = "teta_session";
function readSession() {
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed.role === "admin") return { role: "admin" };
		if (parsed.role === "user" && parsed.id) return parsed;
	} catch {}
	return null;
}
function saveSession(session) {
	if (!session) sessionStorage.removeItem(SESSION_KEY);
	else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function initialSeen() {
	try {
		const raw = localStorage.getItem("teta_seen");
		if (raw == null) {
			const now = Date.now();
			localStorage.setItem("teta_seen", String(now));
			return now;
		}
		return Number(raw) || 0;
	} catch {
		return Date.now();
	}
}
function shareText(model) {
	if (model.kind === "all") return `تحويل ${formatMoney(model.amount)} جنيه لكل الحسابات من Bank Account`;
	return `تحويل ${formatMoney(model.amount)} جنيه من ${model.fromName} إلى ${model.toName}`;
}
function BankApp() {
	const [accounts, setAccounts] = (0, import_react.useState)([]);
	const [txs, setTxs] = (0, import_react.useState)([]);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [loadError, setLoadError] = (0, import_react.useState)("");
	const [session, setSession] = (0, import_react.useState)(readSession);
	const [flash, setFlash] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)("bank");
	const [notes, setNotes] = (0, import_react.useState)(false);
	const [receipt, setReceipt] = (0, import_react.useState)(null);
	const [toast, setToast] = (0, import_react.useState)(null);
	const [seenAt, setSeenAt] = (0, import_react.useState)(initialSeen);
	const [themeId, setThemeId] = (0, import_react.useState)("purple");
	const [showPins, setShowPins] = (0, import_react.useState)(false);
	const [pinGate, setPinGate] = (0, import_react.useState)("");
	const [chatUnread, setChatUnread] = (0, import_react.useState)(0);
	const [loginId, setLoginId] = (0, import_react.useState)("");
	const [loginPin, setLoginPin] = (0, import_react.useState)("");
	const [loginPin2, setLoginPin2] = (0, import_react.useState)("");
	const [toName, setToName] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [drafts, setDrafts] = (0, import_react.useState)({});
	const [confirmId, setConfirmId] = (0, import_react.useState)("");
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newPin, setNewPin] = (0, import_react.useState)("");
	const [newBal, setNewBal] = (0, import_react.useState)("");
	const [payAmount, setPayAmount] = (0, import_react.useState)("");
	const [payNote, setPayNote] = (0, import_react.useState)("");
	const [payPass, setPayPass] = (0, import_react.useState)("");
	const primed = (0, import_react.useRef)(false);
	const known = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const mute = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const sessionRef = (0, import_react.useRef)(session);
	sessionRef.current = session;
	(0, import_react.useEffect)(() => {
		setThemeId(applyTheme(savedTheme()));
		return subscribeBank((state) => {
			setAccounts(state.accounts);
			setTxs(state.txs);
			setReady(true);
		}, (message) => setLoadError(message));
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		if (!primed.current) {
			txs.forEach((tx) => known.current.add(tx.id));
			primed.current = true;
			return;
		}
		const fresh = txs.filter((tx) => !known.current.has(tx.id));
		fresh.forEach((tx) => known.current.add(tx.id));
		const visible = fresh.filter((tx) => !mute.current.has(tx.id));
		if (visible[0] && sessionRef.current) setToast(visible[0]);
	}, [txs, ready]);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const id = setTimeout(() => setToast(null), 12e3);
		return () => clearTimeout(id);
	}, [toast]);
	(0, import_react.useEffect)(() => {
		if (!ready || !session || session.role !== "user") return;
		if (!accounts.some((account) => account.id === session.id)) {
			saveSession(null);
			setSession(null);
		}
	}, [
		accounts,
		ready,
		session
	]);
	const me = session?.role === "user" ? accounts.find((account) => account.id === session.id) ?? null : null;
	const myId = me?.id ?? null;
	const unread = txs.filter((tx) => tx.t > seenAt).length;
	const selected = accounts.find((account) => account.id === loginId);
	const total = accounts.reduce((sum, account) => sum + account.balance, 0);
	async function run(task) {
		if (busy) return;
		setBusy(true);
		try {
			await task();
		} catch (error) {
			setFlash({
				ok: false,
				text: explain(error)
			});
		} finally {
			setBusy(false);
		}
	}
	async function useShare(model) {
		try {
			if (await shareBlob(await renderReceiptBlob(model, themeId), "receipt.png", shareText(model)) === "unsupported") setFlash({
				ok: false,
				text: "المشاركة مش متاحة من المتصفح — استخدم تحميل"
			});
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") return;
			setFlash({
				ok: false,
				text: explain(error)
			});
		}
	}
	async function useDownload(model) {
		try {
			downloadBlob(await renderReceiptBlob(model, themeId), "receipt.png");
		} catch (error) {
			setFlash({
				ok: false,
				text: explain(error)
			});
		}
	}
	function cycleTheme() {
		const current = document.documentElement.getAttribute("data-theme");
		const index = THEMES.findIndex((theme) => theme.id === current);
		const next = THEMES[(index + 1) % THEMES.length];
		setThemeId(applyTheme(next.id));
	}
	function openNotes() {
		const now = Date.now();
		localStorage.setItem("teta_seen", String(now));
		setSeenAt(now);
		setNotes(true);
	}
	function logout() {
		saveSession(null);
		setSession(null);
		setShowPins(false);
		setTab("bank");
		setFlash(null);
	}
	async function onLogin(event) {
		event.preventDefault();
		const pin = loginPin.trim();
		if (loginId === "__bank") {
			if (pin !== "Bank@1628") {
				setFlash({
					ok: false,
					text: "الباسورد غلط"
				});
				return;
			}
			const next = { role: "admin" };
			saveSession(next);
			setSession(next);
			setFlash(null);
			setLoginPin("");
			return;
		}
		if (!selected) {
			setFlash({
				ok: false,
				text: "اختار اسمك"
			});
			return;
		}
		try {
			if (selected.pin) {
				if (selected.pin !== pin) throw new Error("كلمة السر غلط");
			} else {
				if (pin.length < 3) throw new Error("اكتب كلمة سر (3 حروف على الأقل)");
				if (pin !== loginPin2.trim()) throw new Error("كلمتين السر مش زي بعض");
				await setInitialPin(selected.id, pin);
			}
			const next = {
				role: "user",
				id: selected.id
			};
			saveSession(next);
			setSession(next);
			setFlash(null);
			setLoginPin("");
			setLoginPin2("");
		} catch (error) {
			setFlash({
				ok: false,
				text: explain(error)
			});
		}
	}
	function draftOf(id) {
		return drafts[id] ?? {
			amount: "",
			note: "",
			pin: ""
		};
	}
	function patchDraft(id, partial) {
		setDrafts((prev) => ({
			...prev,
			[id]: {
				...draftOf(id),
				...prev[id],
				...partial
			}
		}));
	}
	const people = session?.role === "admin" ? accounts.map((account) => ({
		id: account.id,
		name: account.name
	})) : [{
		id: ADMIN_ID,
		name: ADMIN_NAME
	}, ...accounts.filter((account) => account.id !== myId).map((account) => ({
		id: account.id,
		name: account.name
	}))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Background, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "shell",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "topbar",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "بنك تيته امال الدولي" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "sub",
						children: session?.role === "admin" ? `${ADMIN_NAME} · ${formatMoney(total)} جنيه · ${accounts.length}/10` : me ? `أهلاً ${me.name}` : "بنك العيلة · الحد الأقصى 10 حسابات"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "top-acts",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "Switching Style",
								onClick: cycleTheme,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { className: "icon" })
							}),
							session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "الإشعارات",
								onClick: openNotes,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "icon" }), unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "badge",
									children: unread > 9 ? "9+" : unread
								}) : null]
							}) : null,
							session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "خروج",
								onClick: logout,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "icon" })
							}) : null
						]
					})]
				}),
				loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "flash no",
					children: loadError
				}) : null,
				!ready && !loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "glass",
					children: "جاري التحميل..."
				}) : null,
				flash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: flash.ok ? "flash ok" : "flash no",
					children: flash.text
				}) : null,
				ready && !session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "glass",
					onSubmit: onLogin,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "دخول حساب" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field",
							value: loginId,
							onChange: (event) => setLoginId(event.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "اختار اسمك"
								}),
								accounts.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: account.id,
									children: account.name
								}, account.id)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: BANK_LOGIN_ID,
									children: ADMIN_NAME
								})
							]
						}),
						loginId === "__bank" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							type: "password",
							placeholder: "باسورد البنك",
							value: loginPin,
							autoComplete: "current-password",
							onChange: (event) => setLoginPin(event.target.value)
						}) : null,
						selected?.pin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							type: "password",
							placeholder: "ادخل كلمة السر",
							value: loginPin,
							autoComplete: "current-password",
							onChange: (event) => setLoginPin(event.target.value)
						}) : null,
						selected && !selected.pin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: "أول مرة؟ اعمل كلمة سر لحسابك"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								type: "password",
								placeholder: "كلمة السر الجديدة",
								value: loginPin,
								autoComplete: "new-password",
								onChange: (event) => setLoginPin(event.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								type: "password",
								placeholder: "أكّد كلمة السر",
								value: loginPin2,
								autoComplete: "new-password",
								onChange: (event) => setLoginPin2(event.target.value)
							})
						] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-main",
							type: "submit",
							disabled: busy,
							children: "دخول"
						})
					]
				}) : null,
				session && tab === "bank" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "section-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "كل التحويلات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "muted",
								children: "بتظهر للكل"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "feed",
							children: [txs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: "مفيش تحويلات لسه"
							}) : null, txs.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxRow, {
								tx,
								myId,
								onOpen: () => setReceipt(txReceipt(tx))
							}, tx.id))]
						})]
					}),
					me ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "glass",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted center",
								children: "رصيدك"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bal",
								style: me.balance < 0 ? { color: "var(--no)" } : void 0,
								children: [formatMoney(me.balance), " جنيه"]
							}),
							me.balance < 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted center",
								children: "رصيدك بالسالب: عليك دين للبنك"
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "glass",
						onSubmit: (event) => {
							event.preventDefault();
							if (!me) return;
							run(async () => {
								const tx = await transfer(me, toName, Number(amount));
								mute.current.add(tx.id);
								setReceipt(txReceipt(tx));
								setAmount("");
								setToName("");
								setFlash({
									ok: true,
									text: `تم تحويل ${formatMoney(tx.amt)} جنيه إلى ${tx.to}`
								});
							});
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "تحويل فلوس" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								list: "names",
								placeholder: "اسم المستلم",
								value: toName,
								onChange: (event) => setToName(event.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
								id: "names",
								children: accounts.filter((account) => account.id !== me.id).map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: account.name }, account.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								inputMode: "numeric",
								placeholder: "المبلغ",
								value: amount,
								onChange: (event) => setAmount(event.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn-main",
								type: "submit",
								disabled: busy,
								children: "حوّل"
							})
						]
					})] }) : null,
					session.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "glass",
							onSubmit: (event) => {
								event.preventDefault();
								run(async () => {
									const result = await payEveryone(Number(payAmount), payNote, payPass);
									result.ids.forEach((id) => mute.current.add(id));
									setReceipt({
										kind: "all",
										amount: result.amount,
										count: result.count,
										note: result.note,
										createdAt: result.createdAt,
										names: result.names
									});
									setPayAmount("");
									setPayNote("");
									setPayPass("");
									setFlash({
										ok: true,
										text: `اتحوّل ${formatMoney(result.amount)} جنيه لـ ${result.count} حسابات`
									});
								});
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "تحويل للكل" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "muted",
									children: "المبلغ يتضاف لكل الحسابات في نفس الوقت"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									inputMode: "numeric",
									placeholder: "المبلغ لكل حساب",
									value: payAmount,
									onChange: (event) => setPayAmount(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									placeholder: "سبب التحويل (اختياري)",
									maxLength: 140,
									value: payNote,
									onChange: (event) => setPayNote(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									type: "password",
									placeholder: "باسورد البنك",
									autoComplete: "off",
									value: payPass,
									onChange: (event) => setPayPass(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn-main",
									type: "submit",
									disabled: busy,
									children: "حوّل للكل"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "كلمات السر" }), showPins ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "btn",
								type: "button",
								onClick: () => setShowPins(false),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "icon" }), " إخفاء"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								type: "password",
								placeholder: "اكتب باسورد البنك",
								autoComplete: "off",
								value: pinGate,
								onChange: (event) => setPinGate(event.target.value)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "btn",
								type: "button",
								onClick: () => {
									if (pinGate !== "Bank@1628") {
										setFlash({
											ok: false,
											text: "باسورد البنك غلط"
										});
										return;
									}
									setShowPins(true);
									setPinGate("");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "icon" }), " إظهار كلمات السر"]
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "glass",
							onSubmit: (event) => {
								event.preventDefault();
								run(async () => {
									const name = await createAccount(newName, newPin, newBal.trim() === "" ? null : Number(newBal));
									setNewName("");
									setNewPin("");
									setNewBal("");
									setFlash({
										ok: true,
										text: `تم إنشاء حساب ${name}`
									});
								});
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "حساب جديد" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									placeholder: "الاسم",
									value: newName,
									onChange: (event) => setNewName(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									placeholder: "كلمة سر للحساب (اختياري)",
									value: newPin,
									onChange: (event) => setNewPin(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									inputMode: "numeric",
									placeholder: "رصيد مبدئي (الافتراضي 10,000)",
									value: newBal,
									onChange: (event) => setNewBal(event.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn-main",
									type: "submit",
									disabled: busy,
									children: "إنشاء الحساب"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "glass",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "المحافظ" }), accounts.map((account) => {
								const draft = draftOf(account.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "wallet",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "wallet-top",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: account.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
												className: account.balance < 0 ? "amt out" : "",
												children: formatMoney(account.balance)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "muted",
											children: showPins && account.pin ? `كلمة السر: ${account.pin}` : account.pin ? "محمي بكلمة سر" : "من غير كلمة سر"
										}),
										account.pin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field",
											type: "password",
											placeholder: `كلمة سر ${account.name}`,
											autoComplete: "off",
											value: draft.pin,
											onChange: (event) => patchDraft(account.id, { pin: event.target.value })
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field",
											inputMode: "numeric",
											placeholder: "المبلغ",
											value: draft.amount,
											onChange: (event) => patchDraft(account.id, { amount: event.target.value })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field",
											placeholder: "سبب التحويل (اختياري)",
											maxLength: 140,
											value: draft.note,
											onChange: (event) => patchDraft(account.id, { note: event.target.value })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "acts",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn",
													type: "button",
													disabled: busy,
													onClick: () => void run(async () => {
														const tx = await addFunds(account, Number(draft.amount), draft.note, draft.pin);
														mute.current.add(tx.id);
														setReceipt(txReceipt(tx));
														setFlash({
															ok: true,
															text: `تم إضافة فلوس لـ ${account.name}`
														});
													}),
													children: "إضافة"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn",
													type: "button",
													disabled: busy,
													onClick: () => void run(async () => {
														const tx = await withdrawFunds(account, Number(draft.amount), draft.note, draft.pin);
														mute.current.add(tx.id);
														setReceipt(txReceipt(tx));
														setFlash({
															ok: true,
															text: `تم سحب فلوس من ${account.name}`
														});
													}),
													children: "سحب"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn",
													type: "button",
													disabled: busy,
													onClick: () => void run(async () => {
														await setBalance(account, Number(draft.amount), draft.pin);
														setFlash({
															ok: true,
															text: `تم تحديد رصيد ${account.name}`
														});
													}),
													children: "تحديد"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn",
													type: "button",
													disabled: busy,
													onClick: () => void run(async () => {
														await clearPin(account, draft.pin);
														setFlash({
															ok: true,
															text: `اتمسحت كلمة سر ${account.name}`
														});
													}),
													children: "مسح السر"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "btn btn-danger",
													type: "button",
													disabled: busy,
													onClick: () => {
														if (confirmId !== account.id) {
															setConfirmId(account.id);
															return;
														}
														run(async () => {
															await removeAccount(account, draft.pin);
															setConfirmId("");
															setFlash({
																ok: true,
																text: "تم الحذف"
															});
														});
													},
													children: confirmId === account.id ? "تأكيد الحذف" : "حذف"
												})
											]
										})
									]
								}, account.id);
							})]
						})
					] }) : null
				] }) : null,
				session && tab === "chat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPanel, {
					actorId: session.role === "admin" ? ADMIN_ID : session.id,
					actorName: session.role === "admin" ? ADMIN_NAME : me?.name || "",
					admin: session.role === "admin",
					people,
					onUnread: setChatUnread
				}) : null
			]
		}),
		session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "nav liquid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: tab === "bank" ? "btn on" : "btn",
				type: "button",
				onClick: () => setTab("bank"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "icon" }), " البنك"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: tab === "chat" ? "btn on" : "btn",
				type: "button",
				onClick: () => setTab("chat"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "icon" }),
					" الشات",
					chatUnread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge",
						children: chatUnread > 9 ? "9+" : chatUnread
					}) : null
				]
			})]
		}) : null,
		toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "toast liquid",
			role: "status",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: txTitle(toast, myId) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: toast.note || formatWhen(toast.t)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "acts",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "btn",
							type: "button",
							onClick: () => void useShare(txReceipt(toast)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "icon" }), " مشاركة"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "btn",
							type: "button",
							onClick: () => void useDownload(txReceipt(toast)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "icon" }), " تحميل"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "icon-btn",
							type: "button",
							"aria-label": "إغلاق",
							onClick: () => setToast(null),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "icon" })
						})
					]
				})
			]
		}) : null,
		notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "backdrop",
			onClick: () => setNotes(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "sheet",
				role: "dialog",
				"aria-label": "الإشعارات",
				onClick: (event) => event.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sheet-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "الإشعارات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "icon-btn",
							type: "button",
							"aria-label": "إغلاق",
							onClick: () => setNotes(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "icon" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "كل التحويلات، حتى اللي مش بتاعتك"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sheet-list",
						children: [txs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted",
							children: "مفيش تحويلات لسه"
						}) : null, txs.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxRow, {
							tx,
							myId,
							onOpen: () => {
								setNotes(false);
								setReceipt(txReceipt(tx));
							}
						}, tx.id))]
					})
				]
			})
		}) : null,
		receipt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptDialog, {
			model: receipt,
			themeId,
			onClose: () => setReceipt(null),
			onShare: () => void useShare(receipt),
			onDownload: () => void useDownload(receipt)
		}) : null
	] });
}
function TxRow({ tx, myId, onOpen }) {
	const dir = myId && tx.toId === myId ? "in" : myId && tx.fromId === myId ? "out" : "other";
	const sign = dir === "in" ? "+" : dir === "out" ? "−" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		className: `tx ${dir}`,
		type: "button",
		onClick: onOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "tx-copy",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: txTitle(tx, myId) }),
				tx.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "muted",
					children: tx.note
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "muted",
					children: formatWhen(tx.t)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `amt ${dir}`,
			children: [sign, formatMoney(tx.amt)]
		})]
	});
}
function ReceiptDialog({ model, themeId, onClose, onShare, onDownload }) {
	const [url, setUrl] = (0, import_react.useState)(null);
	const [hint, setHint] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let dead = false;
		let revoke = "";
		renderReceiptBlob(model, themeId).then((blob) => {
			if (dead) return;
			revoke = URL.createObjectURL(blob);
			setUrl(revoke);
		}).catch((error) => {
			if (!dead) setHint(explain(error));
		});
		return () => {
			dead = true;
			if (revoke) URL.revokeObjectURL(revoke);
		};
	}, [model, themeId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "backdrop",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "sheet",
			role: "dialog",
			"aria-label": "إيصال التحويل",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: model.kind === "all" ? "إيصال تحويل للكل" : "إيصال التحويل" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "icon-btn",
						type: "button",
						"aria-label": "إغلاق",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "icon" })
					})]
				}),
				url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: "receipt-img",
					src: url,
					alt: "صورة التحويل"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "جاري تجهيز الصورة..."
				}),
				hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "flash no",
					children: hint
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "acts",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "btn",
						type: "button",
						onClick: onShare,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "icon" }), " مشاركة"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "btn",
						type: "button",
						onClick: onDownload,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "icon" }), " تحميل"]
					})]
				})
			]
		})
	});
}
//#endregion
export { BankApp };
