import { useEffect, useRef, useState } from "react";

// True when the user asks for reduced motion; follows changes live
export function useReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Calls draw(timeSeconds) on every animation frame.
 * Pauses while the tab is hidden. Under reduced motion it draws one still frame and stops.
 * Call the returned redraw() after a resize to repaint a still frame.
 */
export function useAnimationLoop(draw, reduced) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    let frame = 0;
    let running = false;
    let elapsed = 0;
    let last = 0;

    const tick = (now) => {
      elapsed += Math.min(0.1, (now - last) / 1000);
      last = now;
      drawRef.current(elapsed);
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || reduced || document.hidden) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    drawRef.current(elapsed);
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);
}

// Sizes a canvas to its CSS box at the device pixel ratio (capped), and returns the 2D context
export function fitCanvas(canvas, cssWidth, cssHeight, maxRatio = 1.5) {
  const ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
  const w = Math.max(1, Math.round(cssWidth * ratio));
  const h = Math.max(1, Math.round(cssHeight * ratio));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  return { ctx, ratio: w / cssWidth };
}

// Small seeded random, so the sky looks the same on every load
export function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
