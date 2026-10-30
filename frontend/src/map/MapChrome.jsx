import { DoneStar } from "./StarGlyph";

// The learner's level as a dark glossy planet that glows brighter with each level
export function LevelPlanet({ level, glow, size = 150 }) {
  const k = size / 150;
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 34% 28%, #57506a 0%, #1c1824 34%, #07060a 72%)",
        boxShadow: "inset -14px -18px 34px rgba(0,0,0,.85), inset 4px 6px 14px rgba(255,255,255,.08), 0 0 0 1px rgba(255,214,196,.25)",
      }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ inset: -14 * k, boxShadow: "0 0 60px oklch(0.66 0.22 345 / .6), 0 0 120px oklch(0.72 0.14 55 / .35)", opacity: glow }} />
      <span aria-hidden="true" className="absolute rounded-full" style={{ left: 36 * k, top: 24 * k, width: 44 * k, height: 22 * k, background: "rgba(255,255,255,.22)", filter: "blur(5px)", transform: "rotate(-24deg)" }} />
      <span className="ls-display relative leading-none" style={{ fontSize: 72 * k, color: "#fbf7ff" }}>{level}</span>
    </div>
  );
}

export function Stats({ model, compact = false }) {
  const items = [
    [model.tokens, "Tokens"],
    [model.xp, "XP"],
    [`${model.lit} / ${model.total}`, "Quests done"],
  ];
  return (
    <dl className="m-0 grid grid-cols-3 gap-3">
      {items.map(([value, label]) => (
        <div key={label} className="flex flex-col-reverse gap-1.5">
          <dt className={compact ? "text-[12px] leading-[1.2]" : "text-[13px] leading-[1.2]"} style={{ color: "var(--ls-text-3)" }}>{label}</dt>
          <dd className={`m-0 font-medium leading-none ${compact ? "text-[18px]" : "text-[26px]"}`} style={{ color: "#f6f2fb" }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// collapsed: only the title and the button (the folded phone sheet)
export function SuggestedNext({ model, onOpen, titleSize = 30, collapsed = false }) {
  if (model.next) {
    const q = model.next.quest;
    const track = model.tracks.find((t) => t.key === model.next.track);
    return (
      <div className="flex flex-col gap-3.5">
        <span className={`ls-data text-[12px] leading-none tracking-[.1em] ${collapsed ? "ls-sr-only" : ""}`} style={{ color: "var(--ls-text-2)" }}>Suggested next</span>
        <span className="ls-display leading-[1.05]" style={{ fontSize: titleSize, color: "#f8f4fb" }}>{q.title}</span>
        {!collapsed && (
          <div className="flex flex-wrap gap-2">
            <span className="ls-tag">{track?.name}</span>
            <span className="ls-tag">{q.reward} tokens</span>
            <span className="ls-tag">{q.reward * 2} XP</span>
          </div>
        )}
        <button type="button" onClick={() => onOpen(model.next)} className="ls-cta h-[52px] rounded-full border-0 text-[16px] font-semibold">
          Open quest
        </button>
      </div>
    );
  }
  if (model.allDone) {
    return (
      <div className="flex flex-col gap-2.5">
        <span className="ls-data text-[12px] leading-none tracking-[.1em]" style={{ color: "var(--ls-text-2)" }}>Sky complete</span>
        <span className="ls-display leading-[1.05]" style={{ fontSize: titleSize, color: "#f8f4fb" }}>Every star is lit</span>
      </div>
    );
  }
  // Every open quest is cooling down
  return (
    <div className="flex flex-col gap-2.5">
      <span className="ls-data text-[12px] leading-none tracking-[.1em]" style={{ color: "var(--ls-text-2)" }}>Suggested next</span>
      <span className="text-[14px] leading-[1.4]" style={{ color: "var(--ls-text-2)" }}>Your open quests are cooling down. Their stars show the time left.</span>
    </div>
  );
}

// The glass panel on the right of the desktop map
export function SidePanel({ model, onOpen }) {
  return (
    <aside aria-label="Your progress" className="ls-glass absolute flex flex-col gap-6 rounded-ls-panel p-7" style={{ left: 1088, top: 104, width: 304 }}>
      <div className="flex flex-col items-center gap-4">
        <LevelPlanet level={model.level} glow={model.orbGlow} />
        <div className="flex flex-col items-center gap-1.5">
          <span className="ls-data text-[12px] leading-none tracking-[.12em]" style={{ color: "var(--ls-text-2)" }}>Level</span>
          <span className="text-[14px] leading-[1.3]" style={{ color: "var(--ls-text-2)" }}>{model.xpInLevel} / {model.xpSpan} XP to level {model.level + 1}</span>
        </div>
      </div>
      <Stats model={model} />
      <div className="h-px" style={{ background: "rgba(255,255,255,.12)" }} />
      <SuggestedNext model={model} onOpen={onOpen} />
    </aside>
  );
}

export function Legend({ className = "", style }) {
  const item = "flex items-center gap-2.5 text-[14px] font-medium leading-none";
  return (
    <ul aria-label="Map key" className={`ls-glass-pill m-0 flex list-none items-center gap-7 rounded-full px-6 py-3.5 ${className}`} style={{ color: "#e6e1f0", ...style }}>
      <li className={item}><DoneStar size={16} glow={false} />Done</li>
      <li className={item}><span className="h-3 w-3 rounded-full" style={{ border: "2px solid var(--ls-ring)" }} />Open</li>
      <li className={item}>
        <span className="relative h-3.5 w-3.5 overflow-hidden rounded-full" style={{ background: "var(--ls-cooldown)" }}>
          <span className="absolute h-3.5 w-3.5 rounded-full" style={{ left: -4, top: -1, background: "#0a080d" }} />
        </span>
        Cooldown
      </li>
      <li className={item}><span className="h-2.5 w-2.5 rounded-full" style={{ border: "1.5px dashed var(--ls-text-dim)" }} />Locked</li>
      <li className={item}><span className="h-0.5 w-[22px]" style={{ background: "repeating-linear-gradient(90deg, rgba(255,236,222,.8) 0 2px, transparent 2px 6px)" }} />Figure</li>
    </ul>
  );
}
