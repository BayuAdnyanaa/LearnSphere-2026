import { useEffect, useLayoutEffect, useRef, useState } from "react";
import StarGlyph, { DoneStar } from "../map/StarGlyph";
import { TRACKS, clock } from "../map/questModel";

const LETTERS = ["A", "B", "C", "D"];
const SHEET_W = 380;

function Eyebrow({ children }) {
  return <span className="ls-data text-[12px] leading-none tracking-[.1em]" style={{ color: "var(--ls-text-2)" }}>{children}</span>;
}

function Detail({ star, wait, linkOpened, onLinkOpened, onStartQuiz }) {
  const q = star.quest;
  const track = TRACKS[star.track];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="relative mt-1 grid h-10 w-10 shrink-0 place-items-center"><StarGlyph state={star.state} /></span>
        <div className="flex flex-col gap-2 pr-16">
          <Eyebrow>{track.figure}, {track.name}</Eyebrow>
          <h2 id="ls-sheet-title" tabIndex={-1} className="ls-display m-0 text-[32px] leading-[1.05] outline-none">{q.title}</h2>
        </div>
      </div>
      <p className="m-0 text-[15px] leading-[1.5]" style={{ color: "var(--ls-text-1)" }}>{q.description}</p>
      <div className="flex flex-wrap gap-2">
        <span className="ls-tag">{q.reward} tokens</span>
        <span className="ls-tag">{q.reward * 2} XP</span>
      </div>
      <dl className="m-0 grid gap-1.5">
        <dt><Eyebrow>Opens after</Eyebrow></dt>
        <dd className="m-0 text-[14px]" style={{ color: "var(--ls-text-2)" }}>
          {star.prereq ? `${star.prereq.title}${star.prereq.status === "completed" ? " (done)" : ""}` : `Nothing: this is the first star of ${track.figure}`}
        </dd>
      </dl>

      {star.state === "done" && (
        <p className="m-0 flex items-center gap-3 text-[16px] font-semibold"><DoneStar size={20} />Completed</p>
      )}

      {star.state === "cd" && (
        <div className="flex items-center gap-3 rounded-ls-card px-4 py-3" style={{ background: "rgba(20,12,10,.6)", border: "1px solid rgba(255,178,122,.4)" }}>
          <span className="relative grid h-6 w-6 place-items-center"><StarGlyph state="cd" size={0.9} /></span>
          <span className="text-[15px]" style={{ color: "var(--ls-cooldown-text)" }}>
            The quiz opens again in <span className="font-data font-medium">{clock(wait)}</span>
          </span>
        </div>
      )}

      {star.state !== "done" && (
        <div className="flex flex-col gap-3">
          <a
            href={q.link}
            target="_blank"
            rel="noreferrer"
            onClick={onLinkOpened}
            className="ls-pill-btn flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold no-underline"
            style={{ color: "var(--ls-text-1)" }}
          >
            Read this page
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2h7v7M12 2L3 11" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            <span className="ls-sr-only">(opens in a new tab)</span>
          </a>
          {star.state !== "cd" && (
            <>
              <button type="button" onClick={onStartQuiz} disabled={!linkOpened} aria-describedby={linkOpened ? undefined : "ls-start-hint"} className="ls-cta h-[52px] rounded-full border-0 text-[16px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none">
                Start quiz
              </button>
              {!linkOpened && <p id="ls-start-hint" className="m-0 text-center text-[13px]" style={{ color: "var(--ls-text-2)" }}>Open the page first. Start quiz unlocks after that.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Quiz({ star, quiz, isLoading, onSubmit, onBack, isSubmitting }) {
  const [answers, setAnswers] = useState([]);
  const questions = quiz?.questions ?? [];
  const answered = questions.filter((_, i) => answers[i] !== undefined).length;
  const ready = questions.length > 0 && answered === questions.length;

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); if (ready) onSubmit(answers); }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Eyebrow>Quiz</Eyebrow>
          <h2 id="ls-sheet-title" tabIndex={-1} className="ls-display m-0 text-[34px] leading-[1.05] outline-none">{star.quest.title}</h2>
        </div>
        <div className="flex items-center gap-2" role="img" aria-label={`${answered} of ${questions.length || 3} questions answered`}>
          {(questions.length ? questions : [0, 1, 2]).map((_, i) =>
            answers[i] !== undefined ? <DoneStar key={i} size={18} /> : <span key={i} className="grid h-[18px] w-[18px] place-items-center"><span className="h-2.5 w-2.5 rounded-full" style={{ border: "1.5px solid var(--ls-ring)" }} /></span>
          )}
        </div>
      </div>

      {isLoading && <p className="m-0 text-[15px]" style={{ color: "var(--ls-text-2)" }}>Loading the quiz…</p>}
      {!isLoading && !quiz && <p className="m-0 text-[15px]" style={{ color: "var(--ls-text-2)" }}>This quest has no quiz yet.</p>}

      {questions.map((question, qi) => (
        <fieldset key={qi} className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-3 p-0 text-[17px] font-semibold leading-[1.4]">
            <span className="ls-data mr-2 text-[12px] tracking-[.08em]" style={{ color: "var(--ls-text-2)" }}>{qi + 1} of {questions.length}</span>
            {question.text}
          </legend>
          {question.options.map((option, oi) => {
            const checked = answers[qi] === oi;
            return (
              <label
                key={oi}
                className="group flex cursor-pointer items-center gap-3.5 rounded-ls-card px-4 py-3 text-[15px] leading-[1.4] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white"
                style={{
                  background: checked ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.28)",
                  border: checked ? "1px solid oklch(0.85 0.12 60)" : "1px solid rgba(255,255,255,.14)",
                }}
              >
                <input
                  type="radio"
                  name={`ls-q${qi}`}
                  value={oi}
                  checked={checked}
                  onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })}
                  className="ls-sr-only"
                />
                <span aria-hidden="true" className="ls-data grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px]" style={checked ? { background: "var(--ls-accent)", color: "var(--ls-on-accent)" } : { border: "1px solid rgba(255,255,255,.3)", color: "var(--ls-text-2)" }}>
                  {LETTERS[oi]}
                </span>
                <span>{option}</span>
              </label>
            );
          })}
        </fieldset>
      ))}

      <p className="m-0 text-[14px] leading-[1.45]" style={{ color: "var(--ls-text-2)" }}>
        All 3 answers must be right. The result says only passed or not passed.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!ready || isSubmitting} className="ls-cta h-[52px] min-w-[200px] flex-1 rounded-full border-0 text-[16px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none">
          {isSubmitting ? "Checking…" : "Submit answers"}
        </button>
        <button type="button" onClick={onBack} className="ls-pill-btn h-[52px] rounded-full px-6 text-[16px] font-medium">
          Back
        </button>
      </div>
    </form>
  );
}

function Result({ star, result, wait, onDone, onRetry }) {
  if ("passed" in result) {
    const tokens = Number(result.passed.tokensEarned);
    const xp = Number(result.passed.experienceEarned);
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="ls-anim-ignite grid h-24 w-24 place-items-center"><DoneStar size={72} /></span>
        <h2 id="ls-sheet-title" tabIndex={-1} className="ls-display m-0 text-[44px] leading-none outline-none">Passed</h2>
        <p className="m-0 text-[15px]" style={{ color: "var(--ls-text-2)" }}>{star.quest.title} is lit in {TRACKS[star.track].figure}.</p>
        <div className="flex gap-3">
          <span className="ls-tag text-[14px]!">+{tokens} tokens</span>
          <span className="ls-tag text-[14px]!">+{xp} XP</span>
        </div>
        <button type="button" onClick={onDone} className="ls-cta mt-1 h-[52px] w-full rounded-full border-0 text-[16px] font-semibold">Back to the sky</button>
      </div>
    );
  }

  if ("failed" in result || "wait" in result) {
    const ready = wait <= 0;
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative grid h-24 w-24 place-items-center"><StarGlyph state="cd" size={3.2} /></span>
        <h2 id="ls-sheet-title" tabIndex={-1} className="ls-display m-0 text-[44px] leading-none outline-none">{"failed" in result ? "Not passed" : "Not open yet"}</h2>
        {ready ? (
          <p className="m-0 text-[15px]" style={{ color: "var(--ls-text-1)" }}>You can try this quiz again now.</p>
        ) : (
          <p className="m-0 text-[15px]" style={{ color: "var(--ls-cooldown-text)" }} aria-live="off">
            Try again in <span className="font-data text-[18px] font-medium">{clock(wait)}</span>
          </p>
        )}
        <p className="m-0 max-w-[34ch] text-[14px] leading-[1.45]" style={{ color: "var(--ls-text-2)" }}>
          Each failed try makes the next wait longer: 1 minute, 5 minutes, 30 minutes, then 24 hours.
        </p>
        {ready ? (
          <button type="button" onClick={onRetry} className="ls-cta mt-1 h-[52px] w-full rounded-full border-0 text-[16px] font-semibold">Back to the quest</button>
        ) : (
          <button type="button" onClick={onDone} className="ls-pill-btn mt-1 h-[52px] w-full rounded-full text-[16px] font-medium">Back to the sky</button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 id="ls-sheet-title" tabIndex={-1} className="ls-display m-0 text-[36px] leading-none outline-none">Cannot submit</h2>
      <p className="m-0 text-[15px]">{result.rejected.reason}</p>
      <button type="button" onClick={onDone} className="ls-pill-btn h-[52px] rounded-full text-[16px] font-medium">Back to the sky</button>
    </div>
  );
}

/**
 * The quest sheet: detail (anchored to the star on desktop), then quiz, then result.
 * anchor: the star's centre in window pixels, or null on phones.
 */
export default function QuestSheet({ star, step, anchor, phone, wait, quiz, isLoadingQuiz, isSubmitting, result, linkOpened, onLinkOpened, onStartQuiz, onSubmit, onBackToDetail, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    d?.addEventListener("cancel", onCancel);
    return () => d?.removeEventListener("cancel", onCancel);
  }, [onClose]);

  // Move focus to the heading of each step, so screen readers hear the new step
  useEffect(() => {
    ref.current?.querySelector("#ls-sheet-title")?.focus();
  }, [step, result]);

  // Detail sits beside its star; the quiz and result are centred
  useLayoutEffect(() => {
    if (phone || step !== "detail" || !anchor || !ref.current) return setPos(null);
    const h = ref.current.offsetHeight;
    const room = window.innerWidth - anchor.x - 40;
    const left = room > SHEET_W + 16 ? anchor.x + 40 : Math.max(16, anchor.x - 40 - SHEET_W);
    const top = Math.min(Math.max(16, anchor.y - 80), window.innerHeight - h - 16);
    setPos({ left, top });
  }, [anchor, phone, step, star.state, linkOpened]);

  const wide = step !== "detail";
  const style = phone
    ? { margin: "auto 0 0", width: "100%", maxWidth: "100%", maxHeight: "92dvh", borderRadius: "var(--ls-r-panel) var(--ls-r-panel) 0 0" }
    : pos
      ? { margin: 0, position: "fixed", left: pos.left, top: pos.top, width: SHEET_W, maxHeight: "calc(100dvh - 32px)" }
      : { margin: "auto", width: wide ? 680 : SHEET_W, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100dvh - 32px)" };

  return (
    <dialog
      ref={ref}
      aria-labelledby="ls-sheet-title"
      className="ls-glass ls-anim-rise overflow-y-auto overscroll-contain rounded-ls-panel border-0 p-0 text-ls-text-1 backdrop:bg-[rgba(5,4,9,.62)]"
      style={{ ...style, background: "rgba(14,12,20,.86)" }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className={phone ? "p-6 pb-8" : wide ? "p-9" : "p-7"}>
        {step === "detail" && <Detail star={star} wait={wait} linkOpened={linkOpened} onLinkOpened={onLinkOpened} onStartQuiz={onStartQuiz} />}
        {step === "quiz" && <Quiz star={star} quiz={quiz} isLoading={isLoadingQuiz} onSubmit={onSubmit} onBack={onBackToDetail} isSubmitting={isSubmitting} />}
        {step === "result" && result && <Result star={star} result={result} wait={wait} onDone={onClose} onRetry={onBackToDetail} />}
      </div>
      {step === "detail" && (
        <button type="button" onClick={onClose} className="ls-pill-btn absolute right-4 top-4 h-10 rounded-full px-4 text-[14px] font-medium">
          Close
        </button>
      )}
    </dialog>
  );
}
