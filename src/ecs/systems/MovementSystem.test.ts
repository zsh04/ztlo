import test from "node:test";
import assert from "node:assert/strict";
import { MovementSystem } from "./MovementSystem";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
} from "../entities";

test("MovementSystem.isTileBlocked correctly identifies walls and colliders", () => {
  const player = createPlayerEntity("player-1", 1, 1);
  const stone = createStoneBlockEntity("stone-1", 3, 3);
  const plate = createPressurePlateEntity("plate-1", 2, 2, "door-1");
  const door = createDoorEntity("door-1", 5, 5); // solid by default

  const entities = [player, stone, plate, door];

  // Out of bounds
  assert.equal(MovementSystem.isTileBlocked(-1, 0, 10, 10, entities), true);
  assert.equal(MovementSystem.isTileBlocked(10, 5, 10, 10, entities), true);

  // Stone block is solid and impassable by player
  assert.equal(MovementSystem.isTileBlocked(3, 3, 10, 10, entities), true);

  // Closed door is solid and impassable
  assert.equal(MovementSystem.isTileBlocked(5, 5, 10, 10, entities), true);

  // Pressure plate is passable
  assert.equal(MovementSystem.isTileBlocked(2, 2, 10, 10, entities), false);

  // Empty tile is not blocked
  assert.equal(MovementSystem.isTileBlocked(0, 0, 10, 10, entities), false);

  // Player ignores own position when checking for player movement
  assert.equal(MovementSystem.isTileBlocked(1, 1, 10, 10, entities, player.id), false);
});

test("MovementSystem.planPlayerMovement routes around solid blocks", () => {
  const player = createPlayerEntity("player-1", 1, 1);
  const stone = createStoneBlockEntity("stone-1", 2, 1); // directly right of player
  const entities = [player, stone];

  const path = MovementSystem.planPlayerMovement(player, { x: 3, y: 1 }, 10, 10, entities);

  assert.ok(path.length > 0);
  assert.deepEqual(path[0], { x: 1, y: 1 });
  assert.deepEqual(path[path.length - 1], { x: 3, y: 1 });

  // Verify none of the waypoints walk through stone at (2, 1)
  for (const pt of path) {
    assert.notEqual(`${pt.x},${pt.y}`, "2,1");
  }
});

test("MovementSystem.planPlayerMovement navigates to adjacent tile when tapping solid block", () => {
  const player = createPlayerEntity("player-1", 1, 4);
  const stone = createStoneBlockEntity("stone-1", 6, 4);
  const entities = [player, stone];

  // Tap directly on the stone block at (6, 4)
  const path = MovementSystem.planPlayerMovement(player, { x: 6, y: 4 }, 16, 9, entities);

  assert.ok(path.length > 0);
  const destination = path[path.length - 1];
  // Closest adjacent tile from (1, 4) to (6, 4) is (5, 4)
  assert.deepEqual(destination, { x: 5, y: 4 });
});

test("MovementSystem.step advances player tile-by-tile and finishes at destination", () => {
  const player = createPlayerEntity("player-1", 0, 0);
  const entities = [player];

  const path = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  MovementSystem.startMovement(player, path);
  assert.equal(player.movement?.isMoving, true);
  assert.equal(player.movement?.path.length, 2);

  // Step 1: to (1, 0)
  const step1 = MovementSystem.step(player, 10, 10, entities);
  assert.equal(step1.moved, true);
  assert.equal(step1.finished, false);
  assert.deepEqual(step1.currentPos, { x: 1, y: 0 });
  assert.equal(player.position.x, 1);
  assert.equal(player.position.y, 0);
  assert.equal(player.position.previousX, 0);
  assert.equal(player.position.previousY, 0);

  // Step 2: to (2, 0)
  const step2 = MovementSystem.step(player, 10, 10, entities);
  assert.equal(step2.moved, true);
  assert.equal(step2.finished, true);
  assert.deepEqual(step2.currentPos, { x: 2, y: 0 });
  assert.equal(player.position.x, 2);
  assert.equal(player.position.y, 0);
  assert.equal(player.movement?.isMoving, false);

  // Step 3 (when already finished)
  const step3 = MovementSystem.step(player, 10, 10, entities);
  assert.equal(step3.moved, false);
  assert.equal(step3.finished, true);
});

test("MovementSystem.cancelMovement halts active player movement", () => {
  const player = createPlayerEntity("player-1", 0, 0);
  const path = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  MovementSystem.startMovement(player, path);
  assert.equal(player.movement?.isMoving, true);

  MovementSystem.cancelMovement(player);
  assert.equal(player.movement?.isMoving, false);
  assert.equal(player.movement?.path.length, 0);
});
