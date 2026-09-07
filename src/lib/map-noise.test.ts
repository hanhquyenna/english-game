import { describe, expect, it } from "vitest";
import { h2, mulberry, vnoise } from "./map-noise";

describe("map-noise pure logic", () => {
  it("1. vnoise(x,y) with same coordinates returns identical values (deterministic)", () => {
    const v1 = vnoise(15.2, 24.8);
    const v2 = vnoise(15.2, 24.8);
    expect(v1).toBe(v2);

    const rnd1 = mulberry(12345);
    const rnd2 = mulberry(12345);
    for (let i = 0; i < 20; i++) {
      expect(rnd1()).toBe(rnd2());
    }
  });

  it("2. vnoise on 1000 points produces values in [0, 1] without NaN", () => {
    for (let i = 0; i < 1000; i++) {
      const x = (i * 7.3) % 100;
      const y = (i * 13.7) % 100;
      const val = vnoise(x, y);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
      expect(Number.isNaN(val)).toBe(false);
    }
  });

  it("h2 returns pseudo-random fraction in [0, 1)", () => {
    for (let i = 0; i < 100; i++) {
      const val = h2(i * 1.5, i * 2.5);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});
