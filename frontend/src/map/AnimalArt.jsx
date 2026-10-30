// Glassy line-art animals behind the constellations. Each animal is one drop-in SVG file in
// src/assets/constellations/. A file must be drawn on the 1440 x 900 map frame
// (viewBox "0 0 1440 900"), so its key points sit on the quest stars (positions from the
// hand-off), or set x, y, width and height on its root <svg> to place it. It may use the
// classes ls-body (glass fill and outline) and ls-detail (thin inner lines), or its own paints.
// The track's line colour is available as var(--ls-art-line).
import testudo from "../assets/constellations/testudo.svg?raw";
import corvus from "../assets/constellations/corvus.svg?raw";
import phoenix from "../assets/constellations/phoenix.svg?raw";

// The files are our own assets; drop an XML prolog if an editor added one
const strip = (svg) => svg.replace(/<\?xml[^>]*>/, "").trim();
const FIGURES = { icp: strip(testudo), ai: strip(corvus), web3: strip(phoenix) };

// tracks: from buildModel; each sets its figure's opacity and glow
export default function AnimalArt({ tracks }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0" width="1440" height="900" viewBox="0 0 1440 900" style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="ls-glass-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.07" />
        </linearGradient>
        <filter id="ls-art-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ls-art-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <style>{`
        .ls-body { fill: url(#ls-glass-fill); stroke: var(--ls-art-line); stroke-width: 1.6; stroke-linejoin: round; }
        .ls-shell { fill-opacity: .8; }
        .ls-detail { fill: none; stroke: var(--ls-art-line); stroke-opacity: .55; stroke-width: 1; stroke-linecap: round; }
      `}</style>
      {tracks.map((t) => (
        <g
          key={t.key}
          opacity={t.artOpacity}
          filter={t.full ? "url(#ls-art-glow)" : "url(#ls-art-soft)"}
          style={{ "--ls-art-line": `oklch(0.93 0.05 ${t.hue} / .85)` }}
          dangerouslySetInnerHTML={{ __html: FIGURES[t.key] }}
        />
      ))}
    </svg>
  );
}
