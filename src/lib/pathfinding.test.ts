import test from "node:test";
import assert from "node:assert/strict";
import { findPathAStar, findPathToGoalOrAdjacent } from "./pathfinding";

test("findPathAStar computes the shortest direct path avoiding no obstacles", () => {
  const isBlocked = () => false;
  const path = findPathAStar({ x: 0, y: 0 }, { x: 3, y: 0 }, 10, 10, isBlocked);

  assert.equal(path.length, 4);
  assert.deepEqual(path, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ]);
});

test("findPathAStar navigates around an obstacle", () => {
  // Obstacle at (1, 0)
  const isBlocked = (x: number, y: number) => x === 1 && y === 0;
  const path = findPathAStar({ x: 0, y: 0 }, { x: 2, y: 0 }, 10, 10, isBlocked);

  assert.ok(path.length > 0);
  assert.deepEqual(path[0], { x: 0, y: 0 });
  assert.deepEqual(path[path.length - 1], { x: 2, y: 0 });

  // None of the points in path should be the blocked point
  for (const pt of path) {
    assert.notEqual(`${pt.x},${pt.y}`, "1,0");
  }
});

test("findPathAStar returns empty path if goal is blocked", () => {
  const isBlocked = (x: number, y: number) => x === 5 && y === 5;
  const path = findPathAStar({ x: 0, y: 0 }, { x: 5, y: 5 }, 10, 10, isBlocked);

  assert.deepEqual(path, []);
});

test("findPathAStar returns single point if start equals goal", () => {
  const isBlocked = () => false;
  const path = findPathAStar({ x: 2, y: 3 }, { x: 2, y: 3 }, 10, 10, isBlocked);

  assert.deepEqual(path, [{ x: 2, y: 3 }]);
});

test("findPathToGoalOrAdjacent returns direct path when goal is open", () => {
  const isBlocked = () => false;
  const path = findPathToGoalOrAdjacent({ x: 1, y: 1 }, { x: 3, y: 1 }, 10, 10, isBlocked);

  assert.equal(path.length, 3);
  assert.deepEqual(path[path.length - 1], { x: 3, y: 1 });
});

test("findPathToGoalOrAdjacent navigates to closest adjacent open tile when goal is blocked", () => {
  // Solid block at (5, 5). Open tiles adjacent: (4,5), (6,5), (5,4), (5,6)
  const isBlocked = (x: number, y: number) => x === 5 && y === 5;
  // Start at (1, 5) - closest adjacent tile to (5,5) from (1,5) is (4,5)
  const path = findPathToGoalOrAdjacent({ x: 1, y: 5 }, { x: 5, y: 5 }, 10, 10, isBlocked);

  assert.ok(path.length > 0);
  const dest = path[path.length - 1];
  assert.deepEqual(dest, { x: 4, y: 5 });
});

test("findPathToGoalOrAdjacent selects the reachable adjacent tile when some neighbors are blocked", () => {
  // Target at (5, 5) is blocked
  // Neighbors (4, 5), (5, 4), and (5, 6) are also blocked
  // Only (6, 5) is open
  const isBlocked = (x: number, y: number) => {
    if (x === 5 && y === 5) return true;
    if (x === 4 && y === 5) return true;
    if (x === 5 && y === 4) return true;
    if (x === 5 && y === 6) return true;
    return false;
  };

  const path = findPathToGoalOrAdjacent({ x: 0, y: 5 }, { x: 5, y: 5 }, 10, 10, isBlocked);

  assert.ok(path.length > 0);
  const dest = path[path.length - 1];
  assert.deepEqual(dest, { x: 6, y: 5 });
});

test("findPathToGoalOrAdjacent returns [start] if start is already adjacent to the blocked target", () => {
  const isBlocked = (x: number, y: number) => x === 5 && y === 5;
  // Start is already at (4, 5)
  const path = findPathToGoalOrAdjacent({ x: 4, y: 5 }, { x: 5, y: 5 }, 10, 10, isBlocked);

  assert.deepEqual(path, [{ x: 4, y: 5 }]);
});
