import { useEffect, useRef, useState } from "react";
import { Bell, Download, Eye, EyeOff, Landmark, LogOut, MessageCircle, Palette, Share2, X } from "lucide-react";
import { Background } from "@/components/chrome";
import { ChatPanel } from "@/components/chat-panel";
import {
  addFunds,
  clearPin,
  createAccount,
  explain,
  payEveryone,
  removeAccount,
  setBalance,
  setInitialPin,
  subscribeBank,
  transfer,
  withdrawFunds,
} from "@/lib/bank-api";
import {
  ADMIN_ID,
  ADMIN_NAME,
  ADMIN_PASS,
  BANK_LOGIN_ID,
  MAX_ACCOUNTS,
  THEMES,
  applyTheme,
  displayParty,
  formatMoney,
  formatWhen,
  savedTheme,
  txReceipt,
  txTitle,
  type Account,
  type ReceiptModel,
  type Tx,
} from "@/lib/bank-constants";
import { downloadBlob, renderReceiptBlob, shareBlob } from "@/lib/receipt";

type Session = { role: "admin" } | { role: "user"; id: string };
type Draft = { amount: string; note: string; pin: string };
type Flash = { ok: boolean; text: string };

const SESSION_KEY = "teta_session";

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed.role === "admin") return { role: "admin" };
    if (parsed.role === "user" && parsed.id) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(session: Session | null) {
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

function shareText(model: ReceiptModel) {
  if (model.kind === "all") return `تحويل ${formatMoney(model.amount)} جنيه لكل الحسابات من Bank Account`;
  return `تحويل ${formatMoney(model.amount)} جنيه من ${model.fromName} إلى ${model.toName}`;
}

export function BankApp() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState<Session | null>(readSession);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"bank" | "chat">("bank");
  const [notes, setNotes] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptModel | null>(null);
  const [toast, setToast] = useState<Tx | null>(null);
  const [seenAt, setSeenAt] = useState(initialSeen);
  const [themeId, setThemeId] = useState("purple");
  const [showPins, setShowPins] = useState(false);
  const [pinGate, setPinGate] = useState("");
  const [chatUnread, setChatUnread] = useState(0);
  const [loginId, setLoginId] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginPin2, setLoginPin2] = useState("");
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [confirmId, setConfirmId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newBal, setNewBal] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payPass, setPayPass] = useState("");
  const primed = useRef(false);
  const known = useRef(new Set<string>());
  const mute = useRef(new Set<string>());
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    setThemeId(applyTheme(savedTheme()));
    return subscribeBank(
      (state) => {
        setAccounts(state.accounts);
        setTxs(state.txs);
        setReady(true);
      },
      (message) => setLoadError(message),
    );
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 12000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!ready || !session || session.role !== "user") return;
    if (!accounts.some((account) => account.id === session.id)) {
      saveSession(null);
      setSession(null);
    }
  }, [accounts, ready, session]);

  const me = session?.role === "user" ? accounts.find((account) => account.id === session.id) ?? null : null;
  const myId = me?.id ?? null;
  const unread = txs.filter((tx) => tx.t > seenAt).length;
  const selected = accounts.find((account) => account.id === loginId);
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);

  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      setFlash({ ok: false, text: explain(error) });
    } finally {
      setBusy(false);
    }
  }

  async function useShare(model: ReceiptModel) {
    try {
      const blob = await renderReceiptBlob(model, themeId);
      const result = await shareBlob(blob, "receipt.png", shareText(model));
      if (result === "unsupported") setFlash({ ok: false, text: "المشاركة مش متاحة من المتصفح — استخدم تحميل" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setFlash({ ok: false, text: explain(error) });
    }
  }

  async function useDownload(model: ReceiptModel) {
    try {
      const blob = await renderReceiptBlob(model, themeId);
      downloadBlob(blob, "receipt.png");
    } catch (error) {
      setFlash({ ok: false, text: explain(error) });
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

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    const pin = loginPin.trim();
    if (loginId === BANK_LOGIN_ID) {
      if (pin !== ADMIN_PASS) {
        setFlash({ ok: false, text: "الباسورد غلط" });
        return;
      }
      const next: Session = { role: "admin" };
      saveSession(next);
      setSession(next);
      setFlash(null);
      setLoginPin("");
      return;
    }
    if (!selected) {
      setFlash({ ok: false, text: "اختار اسمك" });
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
      const next: Session = { role: "user", id: selected.id };
      saveSession(next);
      setSession(next);
      setFlash(null);
      setLoginPin("");
      setLoginPin2("");
    } catch (error) {
      setFlash({ ok: false, text: explain(error) });
    }
  }

  function draftOf(id: string): Draft {
    return drafts[id] ?? { amount: "", note: "", pin: "" };
  }

  function patchDraft(id: string, partial: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...draftOf(id), ...prev[id], ...partial } }));
  }

  const people =
    session?.role === "admin"
      ? accounts.map((account) => ({ id: account.id, name: account.name }))
      : [
          { id: ADMIN_ID, name: ADMIN_NAME },
          ...accounts.filter((account) => account.id !== myId).map((account) => ({ id: account.id, name: account.name })),
        ];

  return (
    <>
      <Background />
      <main className="shell">
        <header className="topbar">
          <div>
            <h1>بنك تيته امال الدولي</h1>
            <p className="sub">
              {session?.role === "admin"
                ? `${ADMIN_NAME} · ${formatMoney(total)} جنيه · ${accounts.length}/${MAX_ACCOUNTS}`
                : me
                  ? `أهلاً ${me.name}`
                  : "بنك العيلة · الحد الأقصى 10 حسابات"}
            </p>
          </div>
          <div className="top-acts">
            <button className="icon-btn" type="button" aria-label="Switching Style" onClick={cycleTheme}>
              <Palette className="icon" />
            </button>
            {session ? (
              <button className="icon-btn" type="button" aria-label="الإشعارات" onClick={openNotes}>
                <Bell className="icon" />
                {unread > 0 ? <span className="badge">{unread > 9 ? "9+" : unread}</span> : null}
              </button>
            ) : null}
            {session ? (
              <button className="icon-btn" type="button" aria-label="خروج" onClick={logout}>
                <LogOut className="icon" />
              </button>
            ) : null}
          </div>
        </header>

        {loadError ? <p className="flash no">{loadError}</p> : null}
        {!ready && !loadError ? <div className="glass">جاري التحميل...</div> : null}
        {flash ? <p className={flash.ok ? "flash ok" : "flash no"}>{flash.text}</p> : null}

        {ready && !session ? (
          <form className="glass" onSubmit={onLogin}>
            <h2>دخول حساب</h2>
            <select className="field" value={loginId} onChange={(event) => setLoginId(event.target.value)}>
              <option value="">اختار اسمك</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
              <option value={BANK_LOGIN_ID}>{ADMIN_NAME}</option>
            </select>
            {loginId === BANK_LOGIN_ID ? (
              <input className="field" type="password" placeholder="باسورد البنك" value={loginPin} autoComplete="current-password" onChange={(event) => setLoginPin(event.target.value)} />
            ) : null}
            {selected?.pin ? (
              <input className="field" type="password" placeholder="ادخل كلمة السر" value={loginPin} autoComplete="current-password" onChange={(event) => setLoginPin(event.target.value)} />
            ) : null}
            {selected && !selected.pin ? (
              <>
                <p className="muted">أول مرة؟ اعمل كلمة سر لحسابك</p>
                <input className="field" type="password" placeholder="كلمة السر الجديدة" value={loginPin} autoComplete="new-password" onChange={(event) => setLoginPin(event.target.value)} />
                <input className="field" type="password" placeholder="أكّد كلمة السر" value={loginPin2} autoComplete="new-password" onChange={(event) => setLoginPin2(event.target.value)} />
              </>
            ) : null}
            <button className="btn-main" type="submit" disabled={busy}>
              دخول
            </button>
          </form>
        ) : null}

        {session && tab === "bank" ? (
          <>
            <section className="glass">
              <div className="section-head">
                <h2>كل التحويلات</h2>
                <span className="muted">بتظهر للكل</span>
              </div>
              <div className="feed">
                {txs.length === 0 ? <p className="muted">مفيش تحويلات لسه</p> : null}
                {txs.map((tx) => (
                  <TxRow key={tx.id} tx={tx} myId={myId} onOpen={() => setReceipt(txReceipt(tx))} />
                ))}
              </div>
            </section>

            {me ? (
              <>
                <section className="glass">
                  <p className="muted center">رصيدك</p>
                  <div className="bal" style={me.balance < 0 ? { color: "var(--no)" } : undefined}>
                    {formatMoney(me.balance)} جنيه
                  </div>
                  {me.balance < 0 ? <p className="muted center">رصيدك بالسالب: عليك دين للبنك</p> : null}
                </section>
                <form
                  className="glass"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!me) return;
                    void run(async () => {
                      const tx = await transfer(me, toName, Number(amount));
                      mute.current.add(tx.id);
                      setReceipt(txReceipt(tx));
                      setAmount("");
                      setToName("");
                      setFlash({ ok: true, text: `تم تحويل ${formatMoney(tx.amt)} جنيه إلى ${tx.to}` });
                    });
                  }}
                >
                  <h2>تحويل فلوس</h2>
                  <input className="field" list="names" placeholder="اسم المستلم" value={toName} onChange={(event) => setToName(event.target.value)} />
                  <datalist id="names">
                    {accounts
                      .filter((account) => account.id !== me.id)
                      .map((account) => (
                        <option key={account.id} value={account.name} />
                      ))}
                  </datalist>
                  <input className="field" inputMode="numeric" placeholder="المبلغ" value={amount} onChange={(event) => setAmount(event.target.value)} />
                  <button className="btn-main" type="submit" disabled={busy}>
                    حوّل
                  </button>
                </form>
              </>
            ) : null}

            {session.role === "admin" ? (
              <>
                <form
                  className="glass"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      const result = await payEveryone(Number(payAmount), payNote, payPass);
                      result.ids.forEach((id) => mute.current.add(id));
                      setReceipt({
                        kind: "all",
                        amount: result.amount,
                        count: result.count,
                        note: result.note,
                        createdAt: result.createdAt,
                        names: result.names,
                      });
                      setPayAmount("");
                      setPayNote("");
                      setPayPass("");
                      setFlash({ ok: true, text: `اتحوّل ${formatMoney(result.amount)} جنيه لـ ${result.count} حسابات` });
                    });
                  }}
                >
                  <h2>تحويل للكل</h2>
                  <p className="muted">المبلغ يتضاف لكل الحسابات في نفس الوقت</p>
                  <input className="field" inputMode="numeric" placeholder="المبلغ لكل حساب" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} />
                  <input className="field" placeholder="سبب التحويل (اختياري)" maxLength={140} value={payNote} onChange={(event) => setPayNote(event.target.value)} />
                  <input className="field" type="password" placeholder="باسورد البنك" autoComplete="off" value={payPass} onChange={(event) => setPayPass(event.target.value)} />
                  <button className="btn-main" type="submit" disabled={busy}>
                    حوّل للكل
                  </button>
                </form>

                <section className="glass">
                  <h2>كلمات السر</h2>
                  {showPins ? (
                    <button className="btn" type="button" onClick={() => setShowPins(false)}>
                      <EyeOff className="icon" /> إخفاء
                    </button>
                  ) : (
                    <>
                      <input className="field" type="password" placeholder="اكتب باسورد البنك" autoComplete="off" value={pinGate} onChange={(event) => setPinGate(event.target.value)} />
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          if (pinGate !== ADMIN_PASS) {
                            setFlash({ ok: false, text: "باسورد البنك غلط" });
                            return;
                          }
                          setShowPins(true);
                          setPinGate("");
                        }}
                      >
                        <Eye className="icon" /> إظهار كلمات السر
                      </button>
                    </>
                  )}
                </section>

                <form
                  className="glass"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                      const name = await createAccount(newName, newPin, newBal.trim() === "" ? null : Number(newBal));
                      setNewName("");
                      setNewPin("");
                      setNewBal("");
                      setFlash({ ok: true, text: `تم إنشاء حساب ${name}` });
                    });
                  }}
                >
                  <h2>حساب جديد</h2>
                  <input className="field" placeholder="الاسم" value={newName} onChange={(event) => setNewName(event.target.value)} />
                  <input className="field" placeholder="كلمة سر للحساب (اختياري)" value={newPin} onChange={(event) => setNewPin(event.target.value)} />
                  <input className="field" inputMode="numeric" placeholder="رصيد مبدئي (الافتراضي 10,000)" value={newBal} onChange={(event) => setNewBal(event.target.value)} />
                  <button className="btn-main" type="submit" disabled={busy}>
                    إنشاء الحساب
                  </button>
                </form>

                <section className="glass">
                  <h2>المحافظ</h2>
                  {accounts.map((account) => {
                    const draft = draftOf(account.id);
                    return (
                      <div key={account.id} className="wallet">
                        <div className="wallet-top">
                          <b>{account.name}</b>
                          <b className={account.balance < 0 ? "amt out" : ""}>{formatMoney(account.balance)}</b>
                        </div>
                        <p className="muted">
                          {showPins && account.pin ? `كلمة السر: ${account.pin}` : account.pin ? "محمي بكلمة سر" : "من غير كلمة سر"}
                        </p>
                        {account.pin ? (
                          <input className="field" type="password" placeholder={`كلمة سر ${account.name}`} autoComplete="off" value={draft.pin} onChange={(event) => patchDraft(account.id, { pin: event.target.value })} />
                        ) : null}
                        <input className="field" inputMode="numeric" placeholder="المبلغ" value={draft.amount} onChange={(event) => patchDraft(account.id, { amount: event.target.value })} />
                        <input className="field" placeholder="سبب التحويل (اختياري)" maxLength={140} value={draft.note} onChange={(event) => patchDraft(account.id, { note: event.target.value })} />
                        <div className="acts">
                          <button
                            className="btn"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                const tx = await addFunds(account, Number(draft.amount), draft.note, draft.pin);
                                mute.current.add(tx.id);
                                setReceipt(txReceipt(tx));
                                setFlash({ ok: true, text: `تم إضافة فلوس لـ ${account.name}` });
                              })
                            }
                          >
                            إضافة
                          </button>
                          <button
                            className="btn"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                const tx = await withdrawFunds(account, Number(draft.amount), draft.note, draft.pin);
                                mute.current.add(tx.id);
                                setReceipt(txReceipt(tx));
                                setFlash({ ok: true, text: `تم سحب فلوس من ${account.name}` });
                              })
                            }
                          >
                            سحب
                          </button>
                          <button
                            className="btn"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await setBalance(account, Number(draft.amount), draft.pin);
                                setFlash({ ok: true, text: `تم تحديد رصيد ${account.name}` });
                              })
                            }
                          >
                            تحديد
                          </button>
                          <button
                            className="btn"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await clearPin(account, draft.pin);
                                setFlash({ ok: true, text: `اتمسحت كلمة سر ${account.name}` });
                              })
                            }
                          >
                            مسح السر
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (confirmId !== account.id) {
                                setConfirmId(account.id);
                                return;
                              }
                              void run(async () => {
                                await removeAccount(account, draft.pin);
                                setConfirmId("");
                                setFlash({ ok: true, text: "تم الحذف" });
                              });
                            }}
                          >
                            {confirmId === account.id ? "تأكيد الحذف" : "حذف"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </section>
              </>
            ) : null}
          </>
        ) : null}

        {session && tab === "chat" ? (
          <ChatPanel
            actorId={session.role === "admin" ? ADMIN_ID : session.id}
            actorName={session.role === "admin" ? ADMIN_NAME : me?.name || ""}
            admin={session.role === "admin"}
            people={people}
            onUnread={setChatUnread}
          />
        ) : null}
      </main>

      {session ? (
        <nav className="nav liquid">
          <button className={tab === "bank" ? "btn on" : "btn"} type="button" onClick={() => setTab("bank")}>
            <Landmark className="icon" /> البنك
          </button>
          <button className={tab === "chat" ? "btn on" : "btn"} type="button" onClick={() => setTab("chat")}>
            <MessageCircle className="icon" /> الشات
            {chatUnread > 0 ? <span className="badge">{chatUnread > 9 ? "9+" : chatUnread}</span> : null}
          </button>
        </nav>
      ) : null}

      {toast ? (
        <div className="toast liquid" role="status">
          <strong>{txTitle(toast, myId)}</strong>
          <p className="muted">{toast.note || formatWhen(toast.t)}</p>
          <div className="acts">
            <button className="btn" type="button" onClick={() => void useShare(txReceipt(toast))}>
              <Share2 className="icon" /> مشاركة
            </button>
            <button className="btn" type="button" onClick={() => void useDownload(txReceipt(toast))}>
              <Download className="icon" /> تحميل
            </button>
            <button className="icon-btn" type="button" aria-label="إغلاق" onClick={() => setToast(null)}>
              <X className="icon" />
            </button>
          </div>
        </div>
      ) : null}

      {notes ? (
        <div className="backdrop" onClick={() => setNotes(false)}>
          <section className="sheet" role="dialog" aria-label="الإشعارات" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-head">
              <h2>الإشعارات</h2>
              <button className="icon-btn" type="button" aria-label="إغلاق" onClick={() => setNotes(false)}>
                <X className="icon" />
              </button>
            </div>
            <p className="muted">كل التحويلات، حتى اللي مش بتاعتك</p>
            <div className="sheet-list">
              {txs.length === 0 ? <p className="muted">مفيش تحويلات لسه</p> : null}
              {txs.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  myId={myId}
                  onOpen={() => {
                    setNotes(false);
                    setReceipt(txReceipt(tx));
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {receipt ? (
        <ReceiptDialog model={receipt} themeId={themeId} onClose={() => setReceipt(null)} onShare={() => void useShare(receipt)} onDownload={() => void useDownload(receipt)} />
      ) : null}
    </>
  );
}

function TxRow({ tx, myId, onOpen }: { tx: Tx; myId: string | null; onOpen: () => void }) {
  const dir = myId && tx.toId === myId ? "in" : myId && tx.fromId === myId ? "out" : "other";
  const sign = dir === "in" ? "+" : dir === "out" ? "−" : "";
  return (
    <button className={`tx ${dir}`} type="button" onClick={onOpen}>
      <span className="tx-copy">
        <strong>{txTitle(tx, myId)}</strong>
        {tx.note ? <span className="muted">{tx.note}</span> : null}
        <span className="muted">{formatWhen(tx.t)}</span>
      </span>
      <span className={`amt ${dir}`}>
        {sign}
        {formatMoney(tx.amt)}
      </span>
    </button>
  );
}

function ReceiptDialog({
  model,
  themeId,
  onClose,
  onShare,
  onDownload,
}: {
  model: ReceiptModel;
  themeId: string;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  useEffect(() => {
    let dead = false;
    let revoke = "";
    void renderReceiptBlob(model, themeId)
      .then((blob) => {
        if (dead) return;
        revoke = URL.createObjectURL(blob);
        setUrl(revoke);
      })
      .catch((error) => {
        if (!dead) setHint(explain(error));
      });
    return () => {
      dead = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [model, themeId]);

  return (
    <div className="backdrop" onClick={onClose}>
      <section className="sheet" role="dialog" aria-label="إيصال التحويل" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-head">
          <h2>{model.kind === "all" ? "إيصال تحويل للكل" : "إيصال التحويل"}</h2>
          <button className="icon-btn" type="button" aria-label="إغلاق" onClick={onClose}>
            <X className="icon" />
          </button>
        </div>
        {url ? <img className="receipt-img" src={url} alt="صورة التحويل" /> : <p className="muted">جاري تجهيز الصورة...</p>}
        {hint ? <p className="flash no">{hint}</p> : null}
        <div className="acts">
          <button className="btn" type="button" onClick={onShare}>
            <Share2 className="icon" /> مشاركة
          </button>
          <button className="btn" type="button" onClick={onDownload}>
            <Download className="icon" /> تحميل
          </button>
        </div>
      </section>
    </div>
  );
}
