"use client";

import { useEffect, useRef } from "react";
import { createCollectBurst } from "@/lib/pixelfx/collect-burst";

/** Increment trigger for a single pixel celebration; position the wrapper with CSS. */
export function PixelBurst({ trigger, enabled = true, className }: { trigger: number; enabled?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    context.clearRect(0, 0, 112, 108);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!enabled || trigger <= 0 || motion.matches || document.hidden) return;

    const effect = createCollectBurst(trigger);
    let frame = 0;
    let previous = performance.now();
    let stopped = false;
    const stop = () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      context.clearRect(0, 0, 112, 108);
    };
    const tick = (now: number) => {
      if (stopped) return;
      if (now - previous >= 1000 / 30) {
        const elapsed = Math.min((now - previous) / 1000, 0.1);
        previous = now;
        effect.update(elapsed);
        effect.draw(context);
      }
      if (effect.done) stop();
      else frame = window.requestAnimationFrame(tick);
    };
    const visibility = () => { if (document.hidden) stop(); };
    const reducedMotion = () => { if (motion.matches) stop(); };
    frame = window.requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", reducedMotion);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", reducedMotion);
    };
  }, [trigger, enabled]);
  return <canvas ref={canvas} className={className} width={112} height={108} aria-hidden="true" style={{ width: 224, height: 216, pointerEvents: "none", imageRendering: "pixelated" }}/>;
}
