import { useEffect, useMemo, useRef } from "react";
import { fitCanvas, seeded, useAnimationLoop } from "./useAnimationLoop";

// Three depth layers: far stars drift slowest, near stars fastest (pixels per second)
const LAYERS = [
  { count: 120, size: [0.5, 1.1], alpha: [0.22, 0.55], speed: 2.2 },
  { count: 70, size: [0.9, 1.7], alpha: [0.35, 0.75], speed: 4.5 },
  { count: 28, size: [1.4, 2.4], alpha: [0.55, 0.9], speed: 8 },
];
const BRIGHT = 7;

function buildSky() {
  const rnd = seeded(21);
  const layers = LAYERS.map((l) =>
    Array.from({ length: l.count }, () => ({
      x: rnd(),
      y: rnd() * 0.86,
      r: (l.size[0] + rnd() * (l.size[1] - l.size[0])) / 2,
      a: l.alpha[0] + rnd() * (l.alpha[1] - l.alpha[0]),
      tw: rnd() < 0.55 ? 0.35 + rnd() * 0.55 : 0,
      w: 0.8 + rnd() * 1.7,
      ph: rnd() * Math.PI * 2,
    }))
  );
  const bright = Array.from({ length: BRIGHT }, () => ({
    x: 0.04 + rnd() * 0.92,
    y: 0.04 + rnd() * 0.55,
    w: 0.9 + rnd() * 0.9,
    ph: rnd() * Math.PI * 2,
    len: 9 + rnd() * 8,
  }));
  return { layers, bright, rnd };
}

// The full-window night sky behind every screen
export default function SkyCanvas({ reduced }) {
  const ref = useRef(null);
  const sky = useMemo(buildSky, []);
  const shot = useRef({ at: 4, active: null });
  const size = useRef({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => {
      size.current = { w: window.innerWidth, h: window.innerHeight };
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useAnimationLoop((t) => {
    const canvas = ref.current;
    if (!canvas) return;
    const { w, h } = size.current;
    const { ctx, ratio } = fitCanvas(canvas, w, h);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    // Star layers, wrapping around horizontally
    LAYERS.forEach((layer, li) => {
      const shift = (t * layer.speed) % w;
      for (const s of sky.layers[li]) {
        let x = s.x * w - shift;
        if (x < -4) x += w + 8;
        const y = s.y * h + Math.sin(t * 0.05 + s.ph) * (li + 1) * 1.5;
        const twinkle = s.tw ? 1 - s.tw * (0.5 + 0.5 * Math.sin(t * s.w + s.ph)) : 1;
        ctx.globalAlpha = s.a * twinkle;
        ctx.fillStyle = "#fffaf4";
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // A few bright stars with diffraction spikes and a strong twinkle
    for (const b of sky.bright) {
      const x = b.x * w, y = b.y * h;
      const pulse = 0.55 + 0.45 * Math.sin(t * b.w + b.ph);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
      glow.addColorStop(0, "rgba(255,244,232,0.9)");
      glow.addColorStop(1, "rgba(255,244,232,0)");
      ctx.globalAlpha = 0.4 + 0.6 * pulse;
      ctx.fillStyle = glow;
      ctx.fillRect(x - 9, y - 9, 18, 18);
      const len = b.len * (0.55 + 0.45 * pulse);
      ctx.strokeStyle = "rgba(255,240,226,0.75)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - len, y); ctx.lineTo(x + len, y);
      ctx.moveTo(x, y - len); ctx.lineTo(x, y + len);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fffaf4";
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // An occasional shooting star at 18 degrees, every 5 to 12 seconds
    if (!reduced) {
      const s = shot.current;
      if (!s.active && t >= s.at) {
        s.active = { x: sky.rnd() * w * 0.7, y: sky.rnd() * h * 0.35, start: t, dur: 0.9 + sky.rnd() * 0.4 };
      }
      if (s.active) {
        const k = (t - s.active.start) / s.active.dur;
        if (k >= 1) {
          s.active = null;
          s.at = t + 5 + sky.rnd() * 7;
        } else {
          const dx = 560 * k, dy = 182 * k;
          const hx = s.active.x + dx, hy = s.active.y + dy;
          const tail = 120;
          const tx = hx - tail * Math.cos(0.314), ty = hy - tail * Math.sin(0.314);
          const grad = ctx.createLinearGradient(tx, ty, hx, hy);
          grad.addColorStop(0, "rgba(255,246,238,0)");
          grad.addColorStop(1, "rgba(255,246,238,0.95)");
          ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, reduced);

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10" style={{ background: "var(--ls-sky)" }}>
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
