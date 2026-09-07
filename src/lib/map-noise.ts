/**
 * Deterministic PRNG and 2D value noise for procedural map generation.
 *
 * Scenery must not reshuffle on repaint, and a stable seed ensures
 * identical terrain generation across test runs and viewports.
 */

export function mulberry(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRnd = mulberry(20260821);

export function h2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return (
    (h2(xi, yi) * (1 - u) + h2(xi + 1, yi) * u) * (1 - v) +
    (h2(xi, yi + 1) * (1 - u) + h2(xi + 1, yi + 1) * u) * v
  );
}
