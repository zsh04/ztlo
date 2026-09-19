import test from "node:test";
import assert from "node:assert/strict";

import { calculateGridCellSize } from "./viewport";

test("keeps room cells square while fitting a 16:9 sandbox within the viewport", () => {
  assert.equal(calculateGridCellSize(16, 9, 1366, 1024), 79);
  assert.equal(calculateGridCellSize(16, 9, 820, 1180), 64);
});

test("never lets the tilemap fall below the minimum touch target size", () => {
  assert.equal(calculateGridCellSize(16, 9, 640, 480), 64);
});
