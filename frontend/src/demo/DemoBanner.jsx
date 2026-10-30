import { resetDemo } from "./demoActor";

// Says plainly that this build is the demo, and lets the visitor start over
export default function DemoBanner() {
  const startOver = () => {
    resetDemo();
    window.location.reload();
  };

  return (
    <aside
      aria-label="Demo mode"
      className="ls-glass fixed left-1/2 top-[22px] z-20 flex -translate-x-1/2 items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-[13px] max-sm:left-auto max-sm:right-[100px] max-sm:top-[16px] max-sm:translate-x-0 max-sm:gap-2 max-sm:pl-3"
    >
      {/* On a phone the header has room for one word; the welcome screen says the rest */}
      <span style={{ color: "var(--ls-text-2)" }}>
        <span className="sm:hidden">Demo</span>
        <span className="max-sm:hidden">Demo mode. Progress stays in this browser.</span>
      </span>
      <button type="button" onClick={startOver} className="ls-pill-btn h-8 shrink-0 rounded-full px-3 text-[13px] font-medium">
        Start over
      </button>
    </aside>
  );
}
