import { useState } from "react";
import AnimalArt from "./AnimalArt";
import AuroraCanvas from "../sky/AuroraCanvas";
import StarGlyph from "./StarGlyph";
import { FIGURES, STATE_TEXT, clock } from "./questModel";

// A straight segment between two points, trimmed at both ends
function segment(x1, y1, x2, y2, trimA, trimB, style) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  return {
    position: "absolute",
    left: x1 + ux * trimA,
    top: y1 + uy * trimA,
    width: Math.max(0, len - trimA - trimB),
    transformOrigin: "0 50%",
    transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`,
    pointerEvents: "none",
    ...style,
  };
}

function Figures({ model }) {
  const out = [];
  for (const t of model.tracks) {
    const f = FIGURES[t.key];
    const col = `oklch(0.86 0.07 ${t.hue} / ${t.lineAlpha.toFixed(2)})`;
    const pt = (v) => (typeof v === "number" ? [model.starById[v].x, model.starById[v].y, 14] : [...f.pts[v], 4]);
    f.segs.forEach(([u, v], i) => {
      const A = pt(u), B = pt(v);
      out.push(
        <span
          key={`${t.key}-s${i}`}
          style={segment(A[0], A[1], B[0], B[1], A[2], B[2], {
            height: t.full ? 1.5 : 1,
            background: `repeating-linear-gradient(90deg, ${col} 0 2px, transparent 2px 6px)`,
            filter: t.full ? `drop-shadow(0 0 4px oklch(0.8 0.15 ${t.hue}))` : "none",
          })}
        />
      );
    });
    Object.entries(f.pts).forEach(([k, [x, y]]) => {
      out.push(
        <span
          key={`${t.key}-g${k}`}
          className="pointer-events-none absolute rounded-full"
          style={{ left: x - 2.5, top: y - 2.5, width: 5, height: 5, background: col, boxShadow: t.full ? `0 0 8px oklch(0.85 0.14 ${t.hue})` : "none" }}
        />
      );
    });
  }
  return out;
}

function PrereqLines({ model }) {
  return model.lines.map(({ a, b, kind }) => {
    const style =
      kind === "lit"
        ? { height: 2, background: "rgba(255,236,222,.95)", boxShadow: "0 0 10px rgba(255,200,170,.75)", overflow: "hidden" }
        : kind === "reach"
          ? { height: 1, background: "rgba(255,236,222,.6)" }
          : { height: 1, background: "repeating-linear-gradient(90deg, rgba(255,236,222,.35) 0 5px, transparent 5px 10px)" };
    return (
      <span key={`${a.id}-${b.id}`} style={segment(a.x, a.y, b.x, b.y, 16, 16, style)}>
        {kind === "lit" && <span className="ls-shimmer absolute inset-0" style={{ animationDelay: `${-(a.id % 5)}s` }} />}
      </span>
    );
  });
}

function QuestStar({ star, onSelect, selected }) {
  const [hover, setHover] = useState(false);
  const { x, y, side, state, quest } = star;
  const locked = state === "locked";
  const label = locked ? (hover ? "Locked" : "") : quest.title;
  const tip = locked ? `Locked: finish ${star.prereq?.title ?? "the earlier quest"} first` : undefined;

  let pos = { left: x - 85, top: y + 22, width: 170, alignItems: "center", textAlign: "center" };
  if (side === "t") pos = { ...pos, top: y - 22, transform: "translateY(-100%)" };
  if (side === "r") pos = { left: x + 26, top: y - 10, width: 220, alignItems: "flex-start", textAlign: "left" };
  // Left labels are narrow so a long title breaks into two balanced lines beside the star
  if (side === "l") pos = { left: x - 26 - 150, top: y - 10, width: 150, alignItems: "flex-end", textAlign: "right", textWrap: "balance" };

  return (
    <>
      <button
        type="button"
        data-star={star.id}
        aria-label={locked ? "Locked quest" : `${quest.title}, ${STATE_TEXT[state]}${state === "cd" ? `, ${clock(star.wait)} left` : ""}`}
        aria-disabled={locked || undefined}
        title={tip}
        onClick={() => !locked && onSelect(star)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="absolute grid place-items-center rounded-full border-0 bg-transparent p-0 transition-[filter] hover:brightness-150 focus-visible:brightness-150"
        style={{ left: x - 20, top: y - 20, width: 40, height: 40, cursor: locked ? "default" : "pointer", filter: selected ? "brightness(1.6)" : undefined }}
      >
        <StarGlyph state={state} pulse />
      </button>
      <div className="ls-halo pointer-events-none absolute flex flex-col gap-1.5" style={pos}>
        {label && <span className="text-[14px] font-medium leading-[1.3]" style={{ color: locked ? "var(--ls-text-2)" : "var(--ls-text-1)" }}>{label}</span>}
        {state === "next" && (
          <span className="ls-data rounded-full px-[9px] py-[5px] text-[11px] tracking-[.06em]" style={{ background: "var(--ls-accent)", color: "var(--ls-on-accent)", textShadow: "none" }}>
            Next step
          </span>
        )}
        {state === "cd" && (
          <span className="rounded-full px-[9px] py-[5px] font-data text-[11px] font-medium tracking-[.04em]" style={{ background: "rgba(20,12,10,.8)", border: "1px solid rgba(255,178,122,.5)", color: "var(--ls-cooldown-text)", textShadow: "none" }}>
            Cooldown {clock(star.wait)}
          </span>
        )}
      </div>
    </>
  );
}

// The sky scene in the 1440 x 900 design frame, without the page chrome
// phone: use the phone positions of the constellation names
export default function StarStage({ model, onSelect, selectedId, reduced, scale = 1, phone = false }) {
  return (
    <div className="absolute left-0 top-0" style={{ width: 1440, height: 900 }}>
      {/* Nebula per constellation, brighter with progress */}
      {model.tracks.map((t) => (
        <span
          key={t.key}
          aria-hidden="true"
          className="ls-anim-nebula pointer-events-none absolute rounded-full"
          style={{
            left: t.centre[0] - 230,
            top: t.centre[1] - 230,
            width: 460,
            height: 460,
            background: `radial-gradient(circle, oklch(0.6 0.2 ${t.hue} / ${t.nebulaAlpha.toFixed(2)}) 0%, transparent 65%)`,
            animationDelay: `${-t.hue / 10}s`,
          }}
        />
      ))}

      <AnimalArt tracks={model.tracks} />

      {/* The planet; the aurora canvas draws the light along its rim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          left: 720 - 1600,
          top: 735,
          width: 3200,
          height: 3200,
          background: "radial-gradient(circle at 50% 0%, #1d1020 0%, #0a080d 12%, #07060b 30%)",
          boxShadow: "0 0 0 1px rgba(255,222,200,.7), 0 -6px 30px oklch(0.66 0.24 350 / .8), 0 -30px 120px oklch(0.6 0.22 340 / .45)",
        }}
      />
      <AuroraCanvas reduced={reduced} scale={scale} />

      {/* Constellation names */}
      {model.tracks.map((t) => {
        const moved = phone && t.phoneNameAt;
        const [nx, ny] = moved ? t.phoneNameAt : t.nameAt;
        return (
        <div
          key={t.key}
          className="pointer-events-none absolute flex flex-col gap-1.5"
          style={{ left: nx, top: ny, textShadow: "0 0 10px #07060b", ...(t.centred && !moved ? { width: 180, alignItems: "center", textAlign: "center" } : {}) }}
        >
          <span className="ls-display text-[32px] leading-none" style={{ color: t.nameColor }}>{t.figure}</span>
          <span className="ls-data text-[11px] leading-[1.2] tracking-[.12em]" style={{ color: t.trackColor }}>{t.name}</span>
          <span className="text-[13px] leading-[1.2]" style={{ color: "#c9c1d6" }}>{t.progressText}</span>
        </div>
        );
      })}

      <Figures model={model} />
      <PrereqLines model={model} />
      {model.stars.map((s) => (
        <QuestStar key={s.id} star={s} onSelect={onSelect} selected={s.id === selectedId} />
      ))}
    </div>
  );
}
