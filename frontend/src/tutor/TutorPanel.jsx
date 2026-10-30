// The open tutor chat. The chat logic is the legacy Fetch.ai agent (Agentverse mailbox),
// unchanged; this file only gives it the 2a glass look. Loaded lazily with @cosmjs.
import { useEffect, useRef, useState } from "react";
import { Bip39, Random } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

const AGENT_ADDRESS = "agent1qghztqzczs2ge47xz7xr3vduust7zagw4zfdefpeg74e253paquf6gwr0lu";
const AGENTVERSE_URL = "https://agentverse.ai/v1";

// Topic prompts only fill the message box; the learner still sends it
const TOPICS = ["What is a canister?", "How do principals work?", "What does a uAgent do?"];

export default function TutorPanel({ onClose, next, onOpenQuest }) {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [userWallet, setUserWallet] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const createWallet = async () => {
      try {
        const entropy = Random.getBytes(32);
        const mnemonic = Bip39.encode(entropy).toString();
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "fetch" });
        const [{ address }] = await wallet.getAccounts();
        setUserWallet(wallet);
        setUserAddress(address);
        setMessages([{ text: "Hello! I'm the LearnSphere assistant. How can I help you today?", sender: "agent" }]);
      } catch (err) {
        console.error("❌ Error creating wallet:", err);
      }
    };
    createWallet();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const pollForResponse = (address) => {
    let attempts = 0;
    const maxAttempts = 30;
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${AGENTVERSE_URL}/peek/${address}`);
        if (response.status === 200) {
          const incoming = await response.json();
          const messagePayload = JSON.parse(incoming.payload);
          const responseText = messagePayload.content.find((c) => c.type === "TextContent")?.text;
          if (responseText) setMessages((prev) => [...prev, { text: responseText, sender: "agent" }]);
          clearInterval(intervalId);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error polling for messages:", error);
        clearInterval(intervalId);
        setIsLoading(false);
      }
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        setMessages((prev) => [...prev, { text: "Sorry, I didn't receive a response. The agent might be busy. Please try again.", sender: "agent" }]);
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !userWallet || !userAddress || isLoading) return;
    const newMessages = [...messages, { text: userInput, sender: "user" }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);
    try {
      const message = {
        type: "ChatMessage",
        content: [{ type: "TextContent", text: userInput }],
        timestamp: new Date().toISOString(),
        msg_id: crypto.randomUUID(),
      };
      const envelope = {
        version: 1,
        sender: userAddress,
        target: AGENT_ADDRESS,
        session: crypto.randomUUID(),
        protocol: "uagents.contrib.chat.Chat",
        payload: JSON.stringify(message),
        expires: Math.floor(Date.now() / 1000) + 300,
      };
      const envelopeBytes = new TextEncoder().encode(JSON.stringify(envelope));
      const { signature } = await userWallet.signDirect(userAddress, {
        bodyBytes: envelopeBytes,
        authInfoBytes: new Uint8Array(),
        chainId: "",
        accountNumber: 0,
      });
      await fetch(`${AGENTVERSE_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envelope: JSON.stringify(envelope), signature: signature.signature, public_key: signature.pub_key.value }),
      });
      pollForResponse(userAddress);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...newMessages, { text: "Sorry, I couldn't send your message. Please try again.", sender: "agent" }]);
      setIsLoading(false);
    }
  };

  return (
    <section
      role="dialog"
      aria-label="AI tutor"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="ls-glass ls-anim-rise fixed inset-x-3 bottom-3 z-50 flex max-h-[min(640px,calc(100dvh-24px))] flex-col overflow-hidden rounded-ls-panel sm:inset-x-auto sm:bottom-28 sm:right-12 sm:w-[400px]"
    >
      {/* A violet beam from above onto the orb: the one light source in this panel */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48" style={{ background: "radial-gradient(60% 100% at 50% 0%, oklch(0.6 0.2 300 / .45), transparent 70%)" }} />
      <header className="relative flex flex-col items-center gap-2 px-6 pb-4 pt-6">
        <span aria-hidden="true" className="h-14 w-14 rounded-full" style={{ border: "1px solid rgba(255,255,255,.35)", background: "radial-gradient(circle at 40% 34%, #fff 0%, oklch(0.88 0.08 320) 16%, oklch(0.6 0.2 320 / .7) 50%, rgba(24,10,36,.7) 80%)", boxShadow: "var(--ls-glow-tutor), inset 0 0 18px rgba(255,255,255,.5)" }} />
        <h2 className="ls-display m-0 text-[28px] leading-none">Tutor</h2>
        <button type="button" onClick={onClose} className="ls-pill-btn absolute right-4 top-4 h-11 rounded-full px-4 text-[14px] font-medium" aria-label="Close the tutor">
          Close
        </button>
      </header>

      <div className="relative flex min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3" aria-live="polite">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`m-0 max-w-[85%] rounded-[20px] px-4 py-3 text-[14px] leading-[1.45] ${msg.sender === "user" ? "self-end" : "self-start"}`}
            style={msg.sender === "user" ? { background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.2)" } : { background: "rgba(10,8,14,.72)", border: "1px solid rgba(255,255,255,.12)" }}
          >
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
