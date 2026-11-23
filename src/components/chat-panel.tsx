import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send, Users } from "lucide-react";
import {
  createGroup,
  explain,
  openDirect,
  sendChat,
  subscribeMessages,
  subscribeThreads,
  threadLabel,
  type ChatMessage,
  type Thread,
} from "@/lib/bank-api";
import { formatWhen } from "@/lib/bank-constants";

type Person = { id: string; name: string };

const SEEN_KEY = "teta_chat_seen";

function readSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function ChatPanel({
  actorId,
  actorName,
  admin,
  people,
  onUnread,
}: {
  actorId: string;
  actorName: string;
  admin: boolean;
  people: Person[];
  onUnread: (count: number) => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "thread" | "pick" | "group">("list");
  const [text, setText] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState<Record<string, number>>(readSeen);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeThreads(actorId, setThreads, setError), [actorId]);

  useEffect(() => {
    if (!openId) return;
    return subscribeMessages(openId, setMessages, setError);
  }, [openId]);

  useEffect(() => {
    const count = threads.filter(
      (thread) => thread.lastText && thread.lastFromId && thread.lastFromId !== actorId && thread.lastAt > (seen[thread.id] || 0),
    ).length;
    onUnread(count);
  }, [threads, seen, actorId, onUnread]);

  useEffect(() => {
    if (!openId) return;
    const thread = threads.find((item) => item.id === openId);
    if (!thread || (seen[openId] || 0) >= thread.lastAt) return;
    const next = { ...seen, [openId]: thread.lastAt };
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    setSeen(next);
  }, [openId, threads, seen]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, openId]);

  const current = threads.find((thread) => thread.id === openId) ?? null;

  function remember(id: string, at: number) {
    setSeen((prev) => {
      const next = { ...prev, [id]: Math.max(prev[id] || 0, at, Date.now()) };
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function startDirect(person: Person) {
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

  async function onSend(event: React.FormEvent) {
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

  return (
    <section className="glass chat">
      {mode === "thread" && current ? (
        <>
          <div className="chat-head">
            <button className="icon-btn" type="button" aria-label="رجوع" onClick={() => setMode("list")}>
              <ArrowRight className="icon" />
            </button>
            <div className="tx-copy">
              <strong>{threadLabel(current, actorId)}</strong>
              <span className="muted">
                {current.kind === "group" ? `${current.members.length} أعضاء · رسائل بس` : "رسائل بس"}
              </span>
            </div>
          </div>
          <div className="msg-list" ref={scroller}>
            {messages.length === 0 ? <p className="muted center">لسه مفيش رسائل. ابدأ أنت.</p> : null}
            {messages.map((message) => {
              const mine = message.fromId === actorId;
              return (
                <div key={message.id} className={mine ? "bubble mine" : "bubble theirs"}>
                  {current.kind === "group" && !mine ? <b>{message.fromName}</b> : null}
                  <p>{message.text}</p>
                  <span className="muted">{formatWhen(message.t)}</span>
                </div>
              );
            })}
          </div>
          <form className="composer" onSubmit={onSend}>
            <input
              className="field"
              value={text}
              maxLength={500}
              placeholder="اكتب رسالة"
              onChange={(event) => setText(event.target.value)}
            />
            <button className="icon-btn" type="submit" aria-label="إرسال" disabled={busy || !text.trim()}>
              <Send className="icon" />
            </button>
          </form>
        </>
      ) : null}

      {mode === "list" ? (
        <>
          <div className="section-head">
            <h2>الشات</h2>
            <span className="muted">رسائل بس</span>
          </div>
          <div className="acts">
            <button className="btn" type="button" onClick={() => setMode("pick")}>
              رسالة جديدة
            </button>
            {admin ? (
              <button className="btn" type="button" onClick={() => setMode("group")}>
                <Users className="icon" /> جروب
              </button>
            ) : null}
          </div>
          <div className="thread-list" style={{ marginTop: 12 }}>
            {threads.length === 0 ? <p className="muted">مفيش محادثات. ابعت لأي حد في العيلة.</p> : null}
            {threads.map((thread) => {
              const unread =
                thread.lastText && thread.lastFromId && thread.lastFromId !== actorId && thread.lastAt > (seen[thread.id] || 0);
              return (
                <button
                  key={thread.id}
                  className="thread"
                  type="button"
                  onClick={() => {
                    setOpenId(thread.id);
                    setMode("thread");
                    remember(thread.id, thread.lastAt);
                  }}
                >
                  <span className="thread-copy">
                    <strong>
                      {thread.kind === "group" ? "جروب · " : ""}
                      {threadLabel(thread, actorId)}
                    </strong>
                    <span className="muted">{thread.lastText || "لسه مفيش رسائل"}</span>
                  </span>
                  {unread ? <span className="amt in">جديد</span> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {mode === "pick" ? (
        <>
          <div className="chat-head">
            <button className="icon-btn" type="button" aria-label="رجوع" onClick={() => setMode("list")}>
              <ArrowRight className="icon" />
            </button>
            <h2>ابعت لمين؟</h2>
          </div>
          <div className="picker">
            {people.map((person) => (
              <button key={person.id} className="btn" type="button" disabled={busy} onClick={() => void startDirect(person)}>
                {person.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {mode === "group" && admin ? (
        <>
          <div className="chat-head">
            <button className="icon-btn" type="button" aria-label="رجوع" onClick={() => setMode("list")}>
              <ArrowRight className="icon" />
            </button>
            <h2>جروب جديد</h2>
          </div>
          <input className="field" value={groupTitle} placeholder="اسم الجروب" maxLength={40} onChange={(event) => setGroupTitle(event.target.value)} />
          {people.map((person) => (
            <label key={person.id} className="check">
              <input
                type="checkbox"
                checked={picked.includes(person.id)}
                onChange={() =>
                  setPicked((prev) => (prev.includes(person.id) ? prev.filter((id) => id !== person.id) : [...prev, person.id]))
                }
              />
              {person.name}
            </label>
          ))}
          <button className="btn-main" type="button" disabled={busy} onClick={() => void startGroup()}>
            إنشاء الجروب
          </button>
        </>
      ) : null}

      {error ? <p className="flash no">{error}</p> : null}
    </section>
  );
}
