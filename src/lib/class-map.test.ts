import { describe, expect, it } from "vitest";
import {
  buildWorldSets,
  fanOffsets,
  nodeIndexFor,
  toMapNodes,
  trackGrid,
  VILLAGE_SQUARE,
  DEFAULT_LANDMARKS,
  type MapTrack,
} from "./class-map";
import { buildIslands, sliceForLevel, type TopicForIsland } from "./islands";

const sampleTopic = (
  id: string,
  title: string,
  percentComplete: number,
  assigned = true,
  hasExam = true
): TopicForIsland => ({
  id,
  title,
  subtitle: `${title} subtitle`,
  assigned_at: assigned ? "2026-08-01T00:00:00Z" : null,
  percentComplete,
  hasExam,
});

describe("class-map v2 pure logic", () => {
  it("1. trackGrid('learn', 9) returns exact 9 coordinates matching the spec without duplicates", () => {
    const grid = trackGrid("learn", 9);
    expect(grid).toHaveLength(9);
    expect(grid).toEqual([
      { x: 25, y: 24 },
      { x: 21, y: 22 },
      { x: 16, y: 20 },
      { x: 13, y: 15 },
      { x: 17, y: 10 },
      { x: 24, y: 8 },
      { x: 32, y: 7 },
      { x: 38, y: 5 },
      { x: 44, y: 4 },
    ]);
    const set = new Set(grid.map((g) => `${g.x},${g.y}`));
    expect(set.size).toBe(9);
  });

  it("2. trackGrid('arena', 9) does not overlap with learn track", () => {
    const learnGrid = trackGrid("learn", 9);
    const arenaGrid = trackGrid("arena", 9);
    expect(arenaGrid).toHaveLength(9);

    const learnSet = new Set(learnGrid.map((g) => `${g.x},${g.y}`));
    for (const g of arenaGrid) {
      expect(learnSet.has(`${g.x},${g.y}`)).toBe(false);
    }
  });

  it("3. buildWorldSets ensures 2 tracks and 3 landmarks are connected via BFS from village square", () => {
    const [islandLearn] = buildIslands([sampleTopic("t1", "Unit 1", 50)]);
    const [islandArena] = buildIslands([sampleTopic("t2", "Arena Unit", 50)]);
    const tracks: MapTrack[] = [
      { kind: "learn", label: "Đường Học", nodes: toMapNodes(islandLearn, "learn") },
      { kind: "arena", label: "Đường Đấu", nodes: toMapNodes(islandArena, "arena") },
    ];

    const { path } = buildWorldSets(tracks, DEFAULT_LANDMARKS);
    expect(path.has(`${VILLAGE_SQUARE.x},${VILLAGE_SQUARE.y}`)).toBe(true);

    // BFS from square
    const queue = [`${VILLAGE_SQUARE.x},${VILLAGE_SQUARE.y}`];
    const visited = new Set<string>(queue);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const [cx, cy] = curr.split(",").map(Number);
      const neighbors = [
        `${cx + 1},${cy}`,
        `${cx - 1},${cy}`,
        `${cx},${cy + 1}`,
        `${cx},${cy - 1}`,
      ];
      for (const n of neighbors) {
        if (path.has(n) && !visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    // Every node on both tracks and all landmarks must be reachable
    for (const track of tracks) {
      for (const node of track.nodes) {
        expect(visited.has(`${node.grid.x},${node.grid.y}`)).toBe(true);
      }
    }
    for (const lm of DEFAULT_LANDMARKS) {
      expect(visited.has(`${lm.grid.x},${lm.grid.y}`)).toBe(true);
    }
  });

  it("4. buildWorldSets guarantees path ∩ water = ∅", () => {
    const [islandLearn] = buildIslands([sampleTopic("t1", "Unit 1", 50)]);
    const tracks: MapTrack[] = [
      { kind: "learn", label: "Đường Học", nodes: toMapNodes(islandLearn, "learn") },
    ];
    const { path, water } = buildWorldSets(tracks, DEFAULT_LANDMARKS);

    for (const w of water) {
      expect(path.has(w)).toBe(false);
    }
  });

  it("5. nodeIndexFor(0, 9) returns 0 and nodeIndexFor(100, 9) returns 8", () => {
    expect(nodeIndexFor(0, 9)).toBe(0);
    expect(nodeIndexFor(100, 9)).toBe(8);
  });

  it("6. nodeIndexFor clamps negative and oversized inputs without NaN", () => {
    expect(nodeIndexFor(-10, 9)).toBe(0);
    expect(nodeIndexFor(999, 9)).toBe(8);
    expect(Number.isNaN(nodeIndexFor(-10, 9))).toBe(false);
  });

  it("7. fanOffsets(1) returns 1 center offset", () => {
    expect(fanOffsets(1)).toEqual([{ dx: 0, dy: 0 }]);
  });

  it("8. fanOffsets(15) returns 15 offsets where no two pair are closer than 18px", () => {
    const offsets = fanOffsets(15);
    expect(offsets).toHaveLength(15);

    let minDistance = Infinity;
    for (let i = 0; i < offsets.length; i++) {
      for (let j = i + 1; j < offsets.length; j++) {
        const d = Math.hypot(
          offsets[i].dx - offsets[j].dx,
          offsets[i].dy - offsets[j].dy
        );
        if (d < minDistance) minDistance = d;
      }
    }
    expect(minDistance).toBeGreaterThanOrEqual(18);
  });

  it("9. fanOffsets(0) returns empty array without throwing", () => {
    expect(fanOffsets(0)).toEqual([]);
    expect(fanOffsets(-3)).toEqual([]);
  });

  it("10. toMapNodes with learn track sets last node isBoss: true and isArenaFinal: false", () => {
    const [island] = buildIslands([sampleTopic("t1", "Unit 1: Food", 50)]);
    const mapNodes = toMapNodes(island, "learn", "Food");

    expect(mapNodes).toHaveLength(9);
    expect(mapNodes[8].isBoss).toBe(true);
    expect(mapNodes[8].isArenaFinal).toBe(false);
    expect(mapNodes[8].name).toBe("TRÙM CUỐI");
  });

  it("11. toMapNodes with arena track sets last node isArenaFinal: true and isBoss: false", () => {
    const [island] = buildIslands([sampleTopic("t2", "Library Unit", 50)]);
    const mapNodes = toMapNodes(island, "arena", "Library");

    expect(mapNodes).toHaveLength(9);
    expect(mapNodes[8].isBoss).toBe(false);
    expect(mapNodes[8].isArenaFinal).toBe(true);
    expect(mapNodes[8].name).toBe("ĐẤU TRƯỜNG");
  });

  it("12. toMapNodes with locked island sets all node statuses to locked", () => {
    const islands = buildIslands([
      sampleTopic("t1", "Unit 1", 10),
      sampleTopic("t2", "Unit 2", 0),
    ]);
    const mapNodes = toMapNodes(islands[1], "learn", "Unit 2");
    expect(mapNodes.every((n) => n.status === "locked")).toBe(true);
  });

  it("13. student with no topic_progress defaults safely", () => {
    const progress: number | undefined = undefined;
    expect(nodeIndexFor(progress ?? 0, 9)).toBe(0);
  });

  it("14. sliceForLevel with 3, 7, 8, 20 exercises produces no overlapping exercises", () => {
    for (const count of [3, 7, 8, 20]) {
      const items = Array.from({ length: count }, (_, i) => `item_${i + 1}`);
      const seen = new Set<string>();

      for (let lvl = 1; lvl <= 8; lvl++) {
        const slice = sliceForLevel(items, lvl);
        for (const item of slice) {
          expect(seen.has(item)).toBe(false);
          seen.add(item);
        }
      }
      expect(seen.size).toBe(count);
    }
  });
});
