import { describe, expect, it } from "vitest";
import {
  clipPath,
  deformedOutline,
  displace,
  insideBox,
  polygonArea,
  restOutline,
  type Box,
} from "./squish";

const BOX: Box = { x: 36, y: 36, width: 200, height: 60, radius: 10 };
const REST_AREA = BOX.width * BOX.height - (4 - Math.PI) * BOX.radius ** 2;
const R = 26;

describe("displace", () => {
  it("leaves every point alone with no disc", () => {
    expect(displace({ x: 3, y: 4 }, { x: 0, y: 0 }, 0)).toEqual({ x: 3, y: 4 });
  });

  it("moves a point straight out to √(r² + R²)", () => {
    const moved = displace({ x: 3, y: 4 }, { x: 0, y: 0 }, 12);
    expect(Math.hypot(moved.x, moved.y)).toBeCloseTo(13);
    expect(Math.atan2(moved.y, moved.x)).toBeCloseTo(Math.atan2(4, 3));
  });

  it("never lands a point inside the disc", () => {
    for (let i = 0; i < 200; i++) {
      const point = { x: (i % 17) - 8, y: (i % 11) - 5 };
      const moved = displace(point, { x: 0, y: 0 }, R);
      expect(Math.hypot(moved.x, moved.y)).toBeGreaterThanOrEqual(R - 1e-9);
    }
  });
});

describe("restOutline", () => {
  it("encloses the rounded box's area", () => {
    expect(polygonArea(restOutline(BOX, 1))).toBeCloseTo(REST_AREA, -1);
  });
});

describe("deformedOutline", () => {
  const rest = restOutline(BOX, 4);
  const area = (center: { x: number; y: number }) =>
    polygonArea(deformedOutline(rest, center, R, 1));

  it("keeps the area when the disc is outside the shape", () => {
    expect(area({ x: 136, y: 20 }) / REST_AREA).toBeCloseTo(1, 2);
  });

  it("grows by the disc's area when the disc is inside the shape", () => {
    const hole = Math.PI * R * R;
    expect(area({ x: 100, y: 60 }) / (REST_AREA + hole)).toBeCloseTo(1, 2);
  });

  it("splits the segments the disc spreads apart", () => {
    const outline = deformedOutline(rest, { x: 136, y: 37 }, R, 2);
    expect(outline.length).toBeGreaterThan(rest.length);
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i];
      const b = outline[(i + 1) % outline.length];
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(2.01);
    }
  });
});

describe("insideBox", () => {
  it("follows the rounded corners", () => {
    expect(insideBox({ x: 136, y: 66 }, BOX)).toBe(true);
    expect(insideBox({ x: 37, y: 37 }, BOX)).toBe(false);
    expect(insideBox({ x: 46, y: 37 }, BOX)).toBe(true);
    expect(insideBox({ x: 136, y: 30 }, BOX)).toBe(false);
  });
});

describe("clipPath", () => {
  const outline = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];

  it("cuts a hole only when asked", () => {
    expect(clipPath(outline, { x: 5, y: 5 }, 2, false)).toBe(
      'path(evenodd, "M0.00 0.00L10.00 0.00L10.00 10.00Z")',
    );
    expect(clipPath(outline, { x: 5, y: 5 }, 2, true)).toContain(
      "M3.00 5.00A2.00 2.00 0 1 0 7.00 5.00A2.00 2.00 0 1 0 3.00 5.00Z",
    );
  });
});
