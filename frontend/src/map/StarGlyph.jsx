// Quest star glyphs. Each state has its own shape, not only its own colour.
const STAR_PATH = "M12 0L14.2 9.8L24 12L14.2 14.2L12 24L9.8 14.2L0 12L9.8 9.8Z";

export function DoneStar({ size = 28, glow = true, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} style={glow ? { filter: "var(--ls-glow-star)" } : undefined}>
      <path d={STAR_PATH} fill="var(--ls-star)" />
    </svg>
  );
}

// state: done | open | next | cd | locked. pulse: show the pulse ring (map only).
export default function StarGlyph({ state, pulse = false, size = 1 }) {
  if (state === "done") return <DoneStar size={28 * size} />;

  if (state === "open") {
    return (
      <>
        {pulse && <span className="ls-anim-pulse absolute rounded-full" style={{ width: 34 * size, height: 34 * size, border: "1px solid rgba(236,232,255,.7)" }} />}
        <span className="grid place-items-center rounded-full" style={{ width: 16 * size, height: 16 * size, border: "2px solid var(--ls-ring)", boxShadow: "0 0 12px rgba(220,210,255,.5)" }}>
          <span className="rounded-full" style={{ width: 4 * size, height: 4 * size, background: "var(--ls-ring)" }} />
        </span>
      </>
    );
  }

  if (state === "next") {
    return (
      <>
        {pulse && <span className="ls-anim-pulse-next absolute rounded-full" style={{ width: 40 * size, height: 40 * size, border: "1.5px solid oklch(0.8 0.13 55)" }} />}
        <span className="grid place-items-center rounded-full" style={{ width: 22 * size, height: 22 * size, border: "2px solid oklch(0.85 0.12 60)", boxShadow: "var(--ls-glow-next)" }}>
          <span className="rounded-full" style={{ width: 8 * size, height: 8 * size, background: "oklch(0.9 0.09 65)" }} />
        </span>
      </>
    );
  }

  if (state === "cd") {
    // An eclipse: a dark disc offset over a warm disc leaves a crescent
    return (
      <span className="relative overflow-hidden rounded-full" style={{ width: 22 * size, height: 22 * size, background: "var(--ls-cooldown)", boxShadow: "0 0 14px rgba(255,150,90,.6)" }}>
        <span className="absolute rounded-full" style={{ left: -5 * size, top: -1 * size, width: 22 * size, height: 22 * size, background: "var(--ls-planet)" }} />
      </span>
    );
  }

  return <span className="rounded-full" style={{ width: 10 * size, height: 10 * size, border: "1.5px dashed var(--ls-text-dim)", background: "var(--ls-planet)" }} />;
}
