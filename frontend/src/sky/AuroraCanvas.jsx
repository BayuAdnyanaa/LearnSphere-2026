import { useEffect, useMemo, useRef } from "react";
import { fitCanvas, useAnimationLoop } from "./useAnimationLoop";

// Canvas box in the 1440 x 900 frame. It is wider than the frame so the curtain
// continues past the edges on wide screens.
const BOX = { x: -480, y: 380, w: 2400, h: 520 };
// The planet from the hand-off: a 3200 px circle centred at x 720, top edge at y 735
const PLANET = { cx: 720 - BOX.x, cy: 735 + 1600 - BOX.y, r: 1600 };
const RAYS = 240;

// Aurora colours: magenta oklch(0.66 0.24 350), violet oklch(0.68 0.18 300), copper oklch(0.74 0.14 55)
const COLOURS = { magenta: [244, 56, 166], violet: [171, 121, 245], copper: [237, 145, 76] };

// A soft vertical ray, bright at the rim and fading upward, in one colour
function raySprite([r, g, b]) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const x = c.getContext("2d");
  const v = x.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, `rgba(${r},${g},${b},0)`);
  v.addColorStop(0.55, `rgba(${r},${g},${b},0.45)`);
  v.addColorStop(0.9, `rgba(${r},${g},${b},1)`);
  v.addColorStop(1, `rgba(${r},${g},${b},0.5)`);
  x.fillStyle = v;
  x.fillRect(0, 0, 16, 256);
  x.globalCompositeOperation = "destination-in";
  const hgrad = x.createLinearGradient(0, 0, 16, 0);
  hgrad.addColorStop(0, "rgba(0,0,0,0)");
  hgrad.addColorStop(0.5, "rgba(0,0,0,1)");
  hgrad.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = hgrad;
  x.fillRect(0, 0, 16, 256);
  return c;
}

// Smooth bump, 1 at the centre and 0 at width
const bump = (x, centre, width) => {
  const d = (x - centre) / width;
  return d >= 1 || d <= -1 ? 0 : (1 + Math.cos(d * Math.PI)) / 2;
};

// The aurora curtain along the planet rim, plus a slow light that travels along the rim
// scale: the CSS scale of the parent stage, so the canvas stays sharp
export default function AuroraCanvas({ reduced, scale = 1 }) {
  const ref = useRef(null);
  const sprites = useMemo(
    () => Object.fromEntries(Object.entries(COLOURS).map(([k, c]) => [k, raySprite(c)])),
    []
  );
  const scaleRef = useRef(scale);
  const lastT = useRef(0);

  const draw = (t) => {
    lastT.current = t;
    const canvas = ref.current;
    if (!canvas) return;
    const scale = scaleRef.current;
    const { ctx, ratio } = fitCanvas(canvas, BOX.w * scale, BOX.h * scale);
    const k = ratio * scale;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, BOX.w, BOX.h);
    ctx.globalCompositeOperation = "lighter";

    // The colour bands drift slowly along the horizon
    const sway = Math.sin(t * 0.035) * 90;
    for (let i = 0; i <= RAYS; i++) {
      const fx = 120 + (i / RAYS) * (BOX.w - 240);
      const sx = fx + BOX.x; // x in the frame
      const dx = fx - PLANET.cx;
      if (Math.abs(dx) >= PLANET.r) continue;
      const ry = PLANET.cy - Math.sqrt(PLANET.r * PLANET.r - dx * dx);
      const angle = Math.atan2(ry - PLANET.cy, dx) + Math.PI / 2;

      let wM = bump(sx, 430 + sway, 520);
      let wV = bump(sx, 760 - sway * 0.6, 560) * 0.8;
      let wC = bump(sx, 1060 + sway * 0.8, 480);
      const env = Math.max(wM, wV, wC);
      if (env < 0.02) continue;
      // Where bands overlap, share the light so additive blending does not burn to white
      const share = env / (wM + wV + wC);
      wM *= share;
      wV *= share;
      wC *= share;

      // Travelling waves set each ray's height; a fast flicker makes the rays shimmer
      const wave =
        0.5 + 0.25 * Math.sin(sx * 0.014 - t * 0.55) + 0.25 * Math.sin(sx * 0.031 + t * 0.32);
      const height = 40 + 150 * env * (0.45 + 0.55 * wave);
      const flicker = 0.75 + 0.25 * Math.sin(t * 2.6 + i * 1.73);
      const width = 7 + 5 * env;

      ctx.save();
      ctx.translate(fx, ry + 1);
      ctx.rotate(angle);
      for (const [key, weight] of [["magenta", wM], ["violet", wV], ["copper", wC]]) {
        if (weight < 0.03) continue;
        ctx.globalAlpha = 0.3 * weight * flicker;
        ctx.drawImage(sprites[key], -width / 2, -height, width, height);
      }
      ctx.restore();
    }

    // A warm light that travels along the rim, so the planet seems to turn
    const lx = 720 + Math.sin(t * 0.12) * 560;
    const ldx = lx - BOX.x - PLANET.cx;
    const ly = PLANET.cy - Math.sqrt(PLANET.r * PLANET.r - ldx * ldx);
    ctx.save();
    ctx.translate(lx - BOX.x, ly);
    ctx.rotate(Math.atan2(ly - PLANET.cy, ldx) + Math.PI / 2);
    // Sit just above the rim so the light does not spill onto the dark planet
    ctx.translate(0, -8);
    ctx.scale(1, 0.1);
    const sheen = ctx.createRadialGradient(0, 0, 0, 0, 0, 220);
    sheen.addColorStop(0, "rgba(255,206,176,0.22)");
    sheen.addColorStop(1, "rgba(255,226,206,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = sheen;
    ctx.fillRect(-220, -220, 440, 440);
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };
  useAnimationLoop(draw, reduced);

  // Repaint at the new size (the loop is stopped under reduced motion)
  useEffect(() => {
    scaleRef.current = scale;
    if (reduced) draw(lastT.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, reduced]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        left: BOX.x,
        top: BOX.y,
        width: BOX.w,
        height: BOX.h,
        mixBlendMode: "screen",
        filter: "blur(1.5px)",
      }}
    />
  );
}
