import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSceneLayout,
  screenToGridPoint,
  gridToScreenPoint,
} from "./layout";

test("calculateSceneLayout: centers 8x6 room grid in 1280x720 16:9 canvas with >=80px touch targets", () => {
  const layout = calculateSceneLayout(8, 6, 1280, 720);

  // In 1280x720 with 120px padding (1160x600 available):
  // cellW = 1160 / 8 = 145px, cellH = 600 / 6 = 100px -> min is 100px
  assert.equal(layout.tileSize, 100);
  assert.ok(layout.tileSize >= 80, "Tile target must be at least 80px for pediatric motor accessibility");
  assert.equal(layout.totalWidth, 800);
  assert.equal(layout.totalHeight, 600);
  assert.equal(layout.gridOffsetX, 240); // (1280 - 800) / 2
  assert.equal(layout.gridOffsetY, 60);  // (720 - 600) / 2
});

test("calculateSceneLayout: handles 16x9 room grid maintaining aspect ratio and centering", () => {
  const layout = calculateSceneLayout(16, 9, 1280, 720);

  // available 1160x600:
  // cellW = 1160 / 16 = 72px, cellH = 600 / 9 = 66px -> min is 66px
  assert.equal(layout.tileSize, 66);
  assert.ok(layout.tileSize >= 64, "Tile target satisfies minimum baseline");
  assert.equal(layout.totalWidth, 16 * 66);
  assert.equal(layout.totalHeight, 9 * 66);
  assert.equal(layout.gridOffsetX, Math.floor((1280 - 16 * 66) / 2));
  assert.equal(layout.gridOffsetY, Math.floor((720 - 9 * 66) / 2));
});

test("screenToGridPoint: correctly maps canvas pointer coordinates to 8x6 room grid tiles", () => {
  const layout = calculateSceneLayout(8, 6, 1280, 720); // offset (240, 60), size 100

  // Tap inside tile (0, 0): x in [240, 340), y in [60, 160)
  const p0 = screenToGridPoint(250, 70, layout);
  assert.deepEqual(p0, { x: 0, y: 0 });

  // Tap inside tile (3, 2): x in [240 + 300, 240 + 400) = [540, 640), y in [60 + 200, 60 + 300) = [260, 360)
  const p1 = screenToGridPoint(550, 270, layout);
  assert.deepEqual(p1, { x: 3, y: 2 });

  // Tap inside tile (7, 5): bottom right corner
  const p2 = screenToGridPoint(1030, 650, layout);
  assert.deepEqual(p2, { x: 7, y: 5 });
});

test("screenToGridPoint: rejects taps outside playable room matrix", () => {
  const layout = calculateSceneLayout(8, 6, 1280, 720);

  // Left of grid
  assert.equal(screenToGridPoint(100, 300, layout), null);
  // Above grid
  assert.equal(screenToGridPoint(500, 20, layout), null);
  // Right of grid
  assert.equal(screenToGridPoint(1100, 300, layout), null);
  // Below grid
  assert.equal(screenToGridPoint(500, 700, layout), null);
});

test("gridToScreenPoint: computes exact center pixel for tile rendering", () => {
  const layout = calculateSceneLayout(8, 6, 1280, 720); // offset (240, 60), size 100

  const center00 = gridToScreenPoint(0, 0, layout);
  assert.deepEqual(center00, { x: 290, y: 110 }); // 240 + 50, 60 + 50

  const center32 = gridToScreenPoint(3, 2, layout);
  assert.deepEqual(center32, { x: 590, y: 310 }); // 240 + 350, 60 + 250
});
