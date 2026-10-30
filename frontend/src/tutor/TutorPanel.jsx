// The open tutor chat. Each question goes to askTutor on the backend canister, which adds the
// learner's quests as context and asks the LLM canister. The panel sends the last turns back,
// because the canister keeps no conversation.
import { useEffect, useRef, useState } from "react";

// The canister accepts up to 6 earlier turns of 1,000 characters, and questions of 500
const MAX_TURNS = 6;
const MAX_QUESTION = 500;

// Topic prompts only fill the message box; the learner still sends it
const TOPICS = ["What is a canister?", "How do principals work?", "What does a uAgent do?"];

export default function TutorPanel({ actor, onClose, next, onOpenQuest }) {
  const [userInput, setUserInput] = useState("");
  // sender: "user", "tutor", or "note" (a limit or an error, never sent back to the model)
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Escape closes the panel wherever focus is, unless a quest dialog is open over it
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSendMessage = async () => {
    const question = userInput.trim();
    if (!question || isLoading || !actor) return;
    const turns = messages
      .filter((m) => m.sender !== "note")
      .slice(-MAX_TURNS)
      .map((m) => ({ fromLearner: m.sender === "user", text: m.text.slice(0, 1000) }));
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    setUserInput("");
    setIsLoading(true);
    let reply;
    try {
      const result = await actor.askTutor(question, turns);
      if ("ok" in result) reply = { text: result.ok.text, sender: "tutor" };
      else if ("limited" in result) {
        const wait = Number(result.limited.retryAfterSeconds);
        reply = { text: wait > 0 && wait < 120 ? `${result.limited.reason} Try again in ${wait} s.` : result.limited.reason, sender: "note" };
      } else if ("rejected" in result) reply = { text: result.rejected.reason, sender: "note" };
      else reply = { text: result.unavailable.reason, sender: "note" };
    } catch (error) {
      console.error("askTutor failed:", error);
      reply = { text: "The tutor cannot answer right now. Try again later.", sender: "note" };
    }
    setMessages((prev) => [...prev, reply]);
    setIsLoading(false);
  };

  return (
    <section
      role="dialog"
      aria-label="AI tutor"
      className="ls-glass ls-anim-rise fixed inset-x-3 bottom-3 z-50 flex max-h-[min(640px,calc(100dvh-24px))] flex-col overflow-hidden rounded-ls-panel sm:inset-x-auto sm:bottom-28 sm:right-12 sm:w-[400px]"
    >
      {/* A violet beam from above onto the orb: the one light source in this panel */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48" style={{ background: "radial-gradient(60% 100% at 50% 0%, oklch(0.6 0.2 300 / .45), transparent 70%)" }} />
      <header className="relative flex flex-col items-center gap-2 px-6 pb-4 pt-6">
        <span aria-hidden="true" className="h-14 w-14 rounded-full" style={{ border: "1px solid rgba(255,255,255,.35)", background: "radial-gradient(circle at 40% 34%, #fff 0%, oklch(0.88 0.08 320) 16%, oklch(0.6 0.2 320 / .7) 50%, rgba(24,10,36,.7) 80%)", boxShadow: "var(--ls-glow-tutor), inset 0 0 18px rgba(255,255,255,.5)" }} />
        <h2 className="ls-display m-0 text-[28px] leading-none">Tutor</h2>
        <p className="m-0 max-w-[30ch] text-center text-[13px] leading-[1.4]" style={{ color: "var(--ls-text-2)" }}>
          An AI model answers, and it can be wrong. Check the quest's reading page. Do not type personal data.
        </p>
        <button type="button" onClick={onClose} className="ls-pill-btn absolute right-4 top-4 h-11 rounded-full px-4 text-[14px] font-medium" aria-label="Close the tutor">
          Close
        </button>
      </header>

      <div
        className="relative flex min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3 pt-2"
        aria-live="polite"
        style={{ maskImage: "linear-gradient(to bottom, transparent 0, #000 20px)" }}
      >
        {messages.map((msg, i) => (
          <p
            key={i}
            data-sender={msg.sender}
            className={`m-0 max-w-[85%] whitespace-pre-line rounded-[20px] px-4 py-3 text-[14px] leading-[1.45] ${msg.sender === "user" ? "self-end" : "self-start"}`}
            style={
              msg.sender === "user"
                ? { background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.2)" }
                : msg.sender === "note"
                  ? { border: "1px dashed rgba(255,178,122,.45)", color: "var(--ls-cooldown-text)" }
                  : { background: "rgba(10,8,14,.72)", border: "1px solid rgba(255,255,255,.12)" }
            }
          >
            {msg.sender === "tutor" && <span className="ls-sr-only">Tutor: </span>}
            {msg.text}
          </p>
        ))}
        {isLoading && <p className="m-0 self-start text-[14px]" style={{ color: "var(--ls-text-2)" }}>The tutor is answering…</p>}
        <div ref={endRef} />
      </div>

      <div className="relative flex flex-wrap gap-2 px-5 pb-3">
        {next && (
          <button type="button" onClick={() => onOpenQuest(next)} className="ls-cta h-11 rounded-full border-0 px-4 text-[14px] font-semibold">
            Open suggested quest: {next.quest.title}
          </button>
        )}
        {TOPICS.map((t) => (
          <button key={t} type="button" onClick={() => { setUserInput(t); inputRef.current?.focus(); }} className="ls-pill-btn h-11 rounded-full px-4 text-[14px] font-medium">
            {t}
          </button>
        ))}
      </div>

      <form
        className="relative flex items-center gap-2 border-t px-4 py-3"
        style={{ borderColor: "rgba(255,255,255,.12)" }}
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
      >
        <label htmlFor="ls-tutor-input" className="ls-sr-only">Message to the tutor</label>
        <input
          id="ls-tutor-input"
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask about ICP, agents or a quest…"
          maxLength={MAX_QUESTION}
          disabled={isLoading}
          className="h-11 min-w-0 flex-1 rounded-full px-4 text-[14px] outline-offset-2 disabled:opacity-60"
          style={{ background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.18)", color: "var(--ls-text-1)" }}
        />
        <button type="submit" disabled={isLoading || !userInput.trim()} className="ls-cta h-11 rounded-full border-0 px-5 text-[14px] font-semibold disabled:opacity-50">
          Send
        </button>
      </form>
    </section>
  );
}
