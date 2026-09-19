import test from "node:test";
import assert from "node:assert/strict";
import { PhysicsSystem } from "./PhysicsSystem";
import { TriggerSystem } from "./TriggerSystem";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createIceBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  createWallEntity,
} from "../entities";

test("StoneBlock moves exactly 1 grid tile per push impulse and stops immediately", () => {
  const player = createPlayerEntity("player-1", 2, 2);
  const stone = createStoneBlockEntity("stone-1", 3, 2);
  const entities = [player, stone];

  // Push to the right: direction = (+1, 0)
  const result = PhysicsSystem.executePush(
    stone,
    { x: 1, y: 0 },
    8,
    6,
    entities,
    player
  );

  assert.equal(result.success, true);
  assert.equal(result.newPath.length, 1);
  assert.deepEqual(result.newPath[0], { x: 4, y: 2 });
  assert.equal(stone.position.x, 4);
  assert.equal(stone.position.y, 2);
  assert.equal(stone.position.previousX, 3);
  assert.equal(stone.position.previousY, 2);
  assert.equal(stone.pushable?.isSliding, false);

  // Player advances into the vacated tile (3, 2)
  assert.equal(player.position.x, 3);
  assert.equal(player.position.y, 2);
  assert.equal(player.position.previousX, 2);
  assert.equal(player.position.previousY, 2);
});

test("StoneBlock blocked by wall cannot be pushed", () => {
  const player = createPlayerEntity("player-1", 2, 2);
  const stone = createStoneBlockEntity("stone-1", 3, 2);
  const wall = createWallEntity("wall-1", 4, 2); // solid wall right behind stone
  const entities = [player, stone, wall];

  const result = PhysicsSystem.executePush(
    stone,
    { x: 1, y: 0 },
    8,
    6,
    entities,
    player
  );

  assert.equal(result.success, false);
  assert.equal(result.newPath.length, 0);
  assert.equal(stone.position.x, 3);
  assert.equal(stone.position.y, 2);
  assert.equal(player.position.x, 2);
  assert.equal(player.position.y, 2);
});

test("StoneBlock blocked by room boundary cannot be pushed", () => {
  const player = createPlayerEntity("player-1", 6, 2);
  const stone = createStoneBlockEntity("stone-1", 7, 2); // on right edge of 8x6 room (cols 0-7)
  const entities = [player, stone];

  const result = PhysicsSystem.attemptPush(
    stone,
    { x: 1, y: 0 },
    8,
    6,
    entities
  );

  assert.equal(result.success, false);
  assert.equal(result.newPath.length, 0);
});

test("IceBlock slides continuously along impulse vector until colliding with a wall or boundary", () => {
  const player = createPlayerEntity("player-1", 1, 4);
  const ice = createIceBlockEntity("ice-1", 2, 4);
  const wall = createWallEntity("wall-1", 6, 4); // wall at col 6
  const entities = [player, ice, wall];

  // Ice block at (2, 4) pushed towards wall at (6, 4): direction = (+1, 0)
  // Walkable intermediate tiles: (3, 4), (4, 4), (5, 4)
  const result = PhysicsSystem.executePush(
    ice,
    { x: 1, y: 0 },
    8,
    6,
    entities,
    player
  );

  assert.equal(result.success, true);
  assert.equal(result.newPath.length, 3);
  assert.deepEqual(result.newPath, [
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
  ]);
  assert.equal(ice.position.x, 5);
  assert.equal(ice.position.y, 4);
  assert.equal(ice.pushable?.isSliding, true);

  // Player advances to vacated tile (2, 4)
  assert.equal(player.position.x, 2);
  assert.equal(player.position.y, 4);
});

test("IceBlock slides all the way to the room boundary when unobstructed", () => {
  const ice = createIceBlockEntity("ice-1", 4, 1);
  const entities = [ice];

  // In 8x6 room, pushing down from (4, 1): rows 2, 3, 4, 5
  const result = PhysicsSystem.attemptPush(
    ice,
    { x: 0, y: 1 },
    8,
    6,
    entities
  );

  assert.equal(result.success, true);
  assert.equal(result.newPath.length, 4);
  assert.deepEqual(result.newPath[result.newPath.length - 1], { x: 4, y: 5 });
});

test("IceBlock immediately adjacent to an obstacle cannot slide", () => {
  const ice = createIceBlockEntity("ice-1", 3, 3);
  const wall = createWallEntity("wall-1", 3, 2); // obstacle directly above
  const entities = [ice, wall];

  const result = PhysicsSystem.attemptPush(
    ice,
    { x: 0, y: -1 },
    8,
    6,
    entities
  );

  assert.equal(result.success, false);
  assert.equal(result.newPath.length, 0);
});

test("PressurePlate activates when occupied by Zyra and deactivates when vacated", () => {
  const player = createPlayerEntity("player-1", 1, 2);
  const plate = createPressurePlateEntity("plate-1", 6, 2, "door-1");
  const door = createDoorEntity("door-1", 7, 2);
  const entities = [player, plate, door];

  // Initial state: player is not on plate
  let evaluation = TriggerSystem.evaluate(entities);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);
  assert.equal(evaluation.depressedPlates.length, 0);
  assert.equal(evaluation.doorsUnlocked.length, 0);

  // Player steps onto plate (6, 2)
  player.position.x = 6;
  player.position.y = 2;
  evaluation = TriggerSystem.evaluate(entities);
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false); // door unsealed!
  assert.ok(evaluation.depressedPlates.includes("plate-1"));
  assert.ok(evaluation.doorsUnlocked.includes("door-1"));

  // Player vacates plate and steps to (7, 2)
  player.position.x = 7;
  player.position.y = 2;
  evaluation = TriggerSystem.evaluate(entities);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true); // door re-sealed!
  assert.equal(evaluation.depressedPlates.length, 0);
});

test("PressurePlate activates when occupied by StoneBlock or IceBlock", () => {
  const stone = createStoneBlockEntity("stone-1", 6, 2);
  const plate = createPressurePlateEntity("plate-1", 6, 2, "door-1");
  const door = createDoorEntity("door-1", 7, 2);
  const entities = [stone, plate, door];

  // StoneBlock on plate activates trigger and unlocks door
  const eval1 = TriggerSystem.evaluate(entities);
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false);
  assert.ok(eval1.depressedPlates.includes("plate-1"));

  // Move stone off plate
  stone.position.x = 5;
  stone.position.y = 2;
  TriggerSystem.evaluate(entities);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);

  // IceBlock on plate activates trigger
  const ice = createIceBlockEntity("ice-1", 6, 2);
  entities.push(ice);
  const eval2 = TriggerSystem.evaluate(entities);
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false);
  assert.ok(eval2.doorsUnlocked.includes("door-1"));
});

test("Multi-plate circuits require all targeting plates to be depressed before door unseals", () => {
  const plateA = createPressurePlateEntity("plate-a", 2, 1, "door-multi");
  const plateB = createPressurePlateEntity("plate-b", 5, 1, "door-multi");
  const door = createDoorEntity("door-multi", 7, 1);

  const blockA = createStoneBlockEntity("stone-a", 2, 1); // on plateA
  const blockB = createIceBlockEntity("ice-b", 4, 1);    // NOT on plateB yet
  const entities = [plateA, plateB, door, blockA, blockB];

  // Only plateA is depressed; door must remain locked
  let evaluation = TriggerSystem.evaluate(entities);
  assert.equal(plateA.trigger?.isDepressed, true);
  assert.equal(plateB.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);
  assert.equal(evaluation.doorsUnlocked.includes("door-multi"), false);

  // BlockB moves onto plateB (5, 1); both now depressed
  blockB.position.x = 5;
  blockB.position.y = 1;
  evaluation = TriggerSystem.evaluate(entities);
  assert.equal(plateA.trigger?.isDepressed, true);
  assert.equal(plateB.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false); // Door unsealed!
  assert.ok(evaluation.doorsUnlocked.includes("door-multi"));
  assert.equal(evaluation.roomCleared, true);
});
