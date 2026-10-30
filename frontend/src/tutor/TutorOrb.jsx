import { lazy, Suspense, useState } from "react";

// The chat panel pulls in @cosmjs, so it loads only when the learner opens it
const TutorPanel = lazy(() => import("./TutorPanel"));

// The floating glass orb on every screen
export default function TutorOrb({ next, onOpenQuest }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fixed bottom-6 right-4 z-40 flex items-center gap-3.5 sm:bottom-9 sm:right-12">
        {!open && (
          <span aria-hidden="true" className="ls-glass-pill hidden rounded-full px-4 py-3 text-[14px] font-medium leading-none sm:inline" style={{ color: "#e6e1f0" }}>
            Ask the tutor
          </span>
        )}
        <button
          type="button"
          aria-label={open ? "Close the AI tutor" : "Ask the AI tutor"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ls-anim-breathe h-16 w-16 cursor-pointer rounded-full p-0"
          style={{
            border: "1px solid rgba(255,255,255,.35)",
            background: "radial-gradient(circle at 40% 34%, #fff 0%, oklch(0.88 0.08 320) 16%, oklch(0.6 0.2 320 / .7) 50%, rgba(24,10,36,.7) 80%)",
            boxShadow: "var(--ls-glow-tutor), inset 0 0 14px rgba(255,255,255,.35)",
          }}
        />
      </div>
      {open && (
        <Suspense fallback={null}>
          <TutorPanel onClose={() => setOpen(false)} next={next} onOpenQuest={(s) => { setOpen(false); onOpenQuest(s); }} />
        </Suspense>
      )}
    </>
  );
}
