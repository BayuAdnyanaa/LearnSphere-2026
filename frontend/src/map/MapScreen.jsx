import { useEffect, useLayoutEffect, useRef } from "react";
import StarStage from "./StarStage";
import { Legend, LevelPlanet, SidePanel, Stats, SuggestedNext } from "./MapChrome";
import { useViewport } from "../useViewport";

// Phones pan a crop of the frame: x 30..1090, y 130..770
const CROP = { x: 30, y: 130, w: 1060, h: 640 };
const PHONE_SCALE = 0.8;

function DesktopMap({ model, vp, onSelect, selectedId, reduced, onLogout, onAnchor }) {
  const s = Math.min(vp.w / 1440, vp.h / 900);
  const left = (vp.w - 1440 * s) / 2;
  const top = (vp.h - 900 * s) / 2;

  useEffect(() => {
    onAnchor((star) => ({ x: left + star.x * s, y: top + star.y * s }));
  }, [left, top, s, onAnchor]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute" style={{ left, top, width: 1440, height: 900, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <StarStage model={model} onSelect={onSelect} selectedId={selectedId} reduced={reduced} scale={s} />
        <header className="absolute inset-x-0 top-0 flex h-[84px] items-center justify-between px-12">
          <span className="text-[22px] font-semibold tracking-[-.01em]">LearnSphere</span>
          <button type="button" onClick={onLogout} className="ls-pill-btn h-11 rounded-full px-[22px] text-[15px] font-medium">Log out</button>
        </header>
        <h1 className="ls-display absolute m-0 text-[76px] leading-none tracking-[-.01em]" style={{ left: 48, top: 104, color: "#f8f4fb" }}>
          {model.lit} of {model.total} stars lit
        </h1>
        <SidePanel model={model} onOpen={onSelect} />
        <Legend className="absolute" style={{ left: 48, bottom: 40 }} />
      </div>
    </div>
  );
}

function PhoneMap({ model, onSelect, selectedId, reduced, onLogout, onAnchor }) {
  const scroller = useRef(null);
  const focusX = model.next?.x ?? model.stars.find((s) => s.state !== "done" && s.state !== "locked")?.x ?? 400;

  // Start the sky panned to the suggested star
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, (focusX - CROP.x) * PHONE_SCALE - el.clientWidth / 2);
  }, [focusX]);

  useEffect(() => {
    onAnchor(() => null);
  }, [onAnchor]);

  return (
    <div className="flex min-h-dvh flex-col pb-56">
      <header className="flex flex-col gap-4 px-4 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[19px] font-semibold tracking-[-.01em]">LearnSphere</span>
          <button type="button" onClick={onLogout} className="ls-pill-btn h-11 rounded-full px-[18px] text-[14px] font-medium">Log out</button>
        </div>
        <div className="ls-glass flex items-center gap-4 rounded-ls-card px-4 py-3">
          <LevelPlanet level={model.level} glow={model.orbGlow} size={56} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-[13px]" style={{ color: "var(--ls-text-2)" }}>Level {model.level}, {model.xpInLevel} / 100 XP to level {model.level + 1}</span>
            <Stats model={model} compact />
          </div>
        </div>
        <h1 className="ls-display m-0 text-[40px] leading-none">{model.lit} of {model.total} stars lit</h1>
      </header>

      <div ref={scroller} className="relative mt-2 overflow-x-auto overflow-y-hidden overscroll-x-contain" style={{ height: CROP.h * PHONE_SCALE }} aria-label="Star map, scroll sideways" tabIndex={0}>
        <div className="relative" style={{ width: CROP.w * PHONE_SCALE, height: CROP.h * PHONE_SCALE }}>
          <div className="absolute" style={{ left: -CROP.x * PHONE_SCALE, top: -CROP.y * PHONE_SCALE, width: 1440, height: 900, transform: `scale(${PHONE_SCALE})`, transformOrigin: "0 0" }}>
            <StarStage model={model} onSelect={onSelect} selectedId={selectedId} reduced={reduced} scale={PHONE_SCALE} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Legend className="flex-wrap justify-center gap-x-5 gap-y-3 rounded-ls-card" />
      </div>

      <section aria-label="Suggested next quest" className="ls-glass fixed inset-x-0 bottom-0 z-30 rounded-t-ls-panel px-5 pb-6 pr-24 pt-5">
        <SuggestedNext model={model} onOpen={onSelect} titleSize={26} />
      </section>
    </div>
  );
}

export default function MapScreen(props) {
  const vp = useViewport();
  return vp.phone ? <PhoneMap {...props} /> : <DesktopMap {...props} vp={vp} />;
}
