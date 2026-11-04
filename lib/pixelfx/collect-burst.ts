/**
 * Canvas adaptation of pixelfx's pickups/collect-burst by Patch (MIT).
 * The pickup pop also adapts Hugo Duprez's Sprite Fusion effect (MIT).
 * See LICENSE and NOTICE.md in this directory for attribution and changes.
 */
const TAU = Math.PI * 2;
const colors = ["#3b92bb", "#85def4", "#d6fff5", "#ffffff"];

type Star = {
  x: number; y: number; angle: number; speed: number; turn: number;
  life: number; age: number; size: number; phase: number; color: string;
  trail: [number, number][];
};

/** A short, bounded celebration. It owns no timer and never runs in the background. */
export function createCollectBurst(seed = 3) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const range = (min: number, max: number) => min + random() * (max - min);
  const stars: Star[] = Array.from({ length: 14 }, (_, index) => ({
    x: 56, y: 54, angle: index / 14 * TAU + range(-0.2, 0.2),
    speed: range(145, 225) * (index % 3 === 0 ? 1.12 : 0.85),
    turn: (index % 2 ? 1 : -1) * range(2.5, 5), life: range(0.75, 1.15), age: 0,
    size: index % 3 === 0 ? 2.6 : range(1.2, 2), phase: range(0, TAU),
    color: index % 4 === 0 ? colors[3] : index % 2 ? colors[2] : colors[1], trail: [],
  }));
  let time = 0;

  function update(dt: number) {
    time += dt;
    for (const star of stars) {
      if (star.age > star.life) continue;
      star.age += dt;
      star.trail.unshift([star.x, star.y]);
      if (star.trail.length > 4) star.trail.pop();
      star.angle += star.turn * dt * Math.max(0, 1 - star.age * 1.5);
      star.speed -= star.speed * 4.3 * dt;
      star.x += Math.cos(star.angle) * star.speed * dt;
      star.y += Math.sin(star.angle) * star.speed * dt + 6 * star.age * dt;
    }
  }

  function draw(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, 112, 108);
    const pixel = (x: number, y: number, color: string, alpha = 1) => {
      context.globalAlpha = Math.max(0, Math.min(1, alpha));
      context.fillStyle = color;
      context.fillRect(Math.round(x), Math.round(y), 1, 1);
    };
    if (time < 0.32) {
      const progress = time / 0.32;
      const radius = 3 + 23 * (1 - Math.pow(2, -10 * progress));
      for (let angle = 0; angle < TAU; angle += 0.5 / radius) {
        pixel(56 + Math.cos(angle) * radius, 54 + Math.sin(angle) * radius, colors[2], 1 - progress);
      }
    }
    for (const star of stars) {
      if (star.age > star.life) continue;
      const remaining = 1 - star.age / star.life;
      const twinkle = 0.65 + 0.35 * Math.sin(star.age * 26 + star.phase);
      star.trail.forEach(([x, y], index) => {
        if (index > 0) pixel(x, y, index < 2 ? colors[1] : colors[0], (1 - index / 4) * remaining);
      });
      if (remaining < 0.3 && Math.sin(star.age * 40 + star.phase) < 0) continue;
      const size = Math.round(star.size * twinkle * Math.min(1, remaining * 2.5));
      pixel(star.x, star.y, colors[3], remaining);
      for (let distance = 1; distance <= size; distance++) {
        const alpha = remaining * (1 - distance / (size + 1));
        pixel(star.x - distance, star.y, star.color, alpha);
        pixel(star.x + distance, star.y, star.color, alpha);
        pixel(star.x, star.y - distance, star.color, alpha);
        pixel(star.x, star.y + distance, star.color, alpha);
      }
    }
    context.globalAlpha = 1;
  }

  return { update, draw, get done() { return time >= 1.35; } };
}
