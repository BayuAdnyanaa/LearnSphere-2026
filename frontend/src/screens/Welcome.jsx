import AuroraCanvas from "../sky/AuroraCanvas";
import { useViewport } from "../useViewport";

// The logged-out screen: the planet horizon is its one light source
export default function Welcome({ onLogin, reduced, error, demo = false }) {
  const vp = useViewport();
  // Cover the window with the 1440 x 900 horizon, anchored to the bottom
  const s = Math.max(vp.w / 1440, vp.h / 900);
  const left = (vp.w - 1440 * s) / 2;
  const top = vp.h - 900 * s;

  return (
    <div className="fixed inset-0 overflow-clip">
      <div aria-hidden="true" className="absolute" style={{ left, top, width: 1440, height: 900, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <div
          className="absolute rounded-full"
          style={{
            left: 720 - 1600, top: 735, width: 3200, height: 3200,
            background: "radial-gradient(circle at 50% 0%, #1d1020 0%, #0a080d 12%, #07060b 30%)",
            boxShadow: "0 0 0 1px rgba(255,222,200,.7), 0 -6px 30px oklch(0.66 0.24 350 / .8), 0 -30px 120px oklch(0.6 0.22 340 / .45)",
          }}
        />
        <AuroraCanvas reduced={reduced} scale={s} />
      </div>

      <header className="absolute inset-x-0 top-0 flex h-[84px] items-center px-6 sm:px-12">
        <span className="text-[22px] font-semibold tracking-[-.01em]">LearnSphere</span>
      </header>

      <main className="relative flex h-full flex-col justify-center px-6 pb-[22vh] sm:px-12 lg:pl-[8vw]">
        <h1 className="ls-display m-0 max-w-[12ch] text-[clamp(52px,9vw,112px)] leading-[0.95] tracking-[-.01em]" style={{ color: "#f8f4fb" }}>
          Light the sky by learning
        </h1>
        <p className="mb-0 mt-6 max-w-[46ch] text-[17px] leading-[1.55]" style={{ color: "var(--ls-text-2)" }}>
          Each quest is a star. Read one page, answer three questions, and the star is lit. The constellations teach Web3, the Internet Computer and AI agents.
        </p>
        <div className="mt-9 flex flex-col items-start gap-3">
          <button type="button" onClick={onLogin} className="ls-cta h-14 rounded-full border-0 px-8 text-[17px] font-semibold">
            {demo ? "Start the demo" : "Log in with Internet Identity"}
          </button>
          <span className="max-w-[52ch] text-[14px] leading-[1.5]" style={{ color: "var(--ls-text-2)" }}>
            {demo
              ? "Demo mode: no login, and your progress stays in this browser. The full version runs on the Internet Computer, with Internet Identity and an AI tutor."
              : "Internet Identity is the passkey login of the Internet Computer."}
          </span>
          {error && <p role="alert" className="m-0 text-[14px]" style={{ color: "var(--ls-cooldown-text)" }}>{error}</p>}
        </div>
      </main>
    </div>
  );
}
