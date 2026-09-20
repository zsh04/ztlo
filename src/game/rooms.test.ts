import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld } from "../ecs/world";
import {
  SHRINE_00_EQUILIBRIUM,
  SHRINE_01_STILL_WEIGHT,
  SHRINE_02_GLACIAL_FLOW,
  SHRINE_03_HARMONY_GATES,
  ALL_SHRINE_ROOMS,
} from "./rooms";

test("Canonical 8x6 Shrine of Equilibrium conforms to Level 1-1 Specification", () => {
  assert.equal(SHRINE_00_EQUILIBRIUM.width, 8);
  assert.equal(SHRINE_00_EQUILIBRIUM.height, 6);
  assert.equal(SHRINE_00_EQUILIBRIUM.name, "Shrine of Equilibrium");

  const world = new GameWorld(SHRINE_00_EQUILIBRIUM);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_00_EQUILIBRIUM.entities)));

  const player = world.getPlayer();
  assert.ok(player);
  assert.equal(player.position.x, 1);
  assert.equal(player.position.y, 2);

  const stone = world.getEntityList().find((e) => e.renderable.shape === "stone");
  assert.ok(stone);
  assert.equal(stone.position.x, 3);
  assert.equal(stone.position.y, 2);

  const ice = world.getEntityList().find((e) => e.renderable.shape === "ice");
  assert.ok(ice);
  assert.equal(ice.position.x, 4);
  assert.equal(ice.position.y, 4);

  const plate = world.getEntityList().find((e) => e.renderable.shape === "plate");
  assert.ok(plate);
  assert.equal(plate.position.x, 6);
  assert.equal(plate.position.y, 2);

  const door = world.getEntityList().find((e) => e.renderable.shape === "door");
  assert.ok(door);
  assert.equal(door.position.x, 7);
  assert.equal(door.position.y, 2);
  assert.equal(door.collider?.isSolid, true);
});

test("Pure ECS integration: solving 8x6 Shrine of Equilibrium unseals the gate", () => {
  const world = new GameWorld(SHRINE_00_EQUILIBRIUM);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_00_EQUILIBRIUM.entities)));

  const player = world.getPlayer()!;
  const stone = world.getEntityList().find((e) => e.renderable.shape === "stone")!;
  const door = world.getEntityList().find((e) => e.renderable.shape === "door")!;

  // Initial state: door is solid locked
  assert.equal(door.collider?.isSolid, true);

  // Player approaches stone block: moves to (2, 2)
  player.position.x = 2;
  player.position.y = 2;

  // Push 1: stone from (3, 2) to (4, 2)
  const push1 = world.pushBlock(stone.id, { x: 1, y: 0 });
  assert.equal(push1.success, true);
  assert.equal(stone.position.x, 4);
  assert.equal(player.position.x, 3);
  world.evaluateTriggers();
  assert.equal(door.collider?.isSolid, true);

  // Push 2: stone from (4, 2) to (5, 2)
  const push2 = world.pushBlock(stone.id, { x: 1, y: 0 });
  assert.equal(push2.success, true);
  assert.equal(stone.position.x, 5);
  assert.equal(player.position.x, 4);
  world.evaluateTriggers();
  assert.equal(door.collider?.isSolid, true);

  // Push 3: stone from (5, 2) to (6, 2) onto pressure plate!
  const push3 = world.pushBlock(stone.id, { x: 1, y: 0 });
  assert.equal(push3.success, true);
  assert.equal(stone.position.x, 6);
  assert.equal(player.position.x, 5);

  const evalResult = world.evaluateTriggers();
  assert.ok(evalResult.doorsUnlocked.includes("door-1"));
  assert.equal(door.collider?.isSolid, false); // Door unsealed!
  assert.equal(evalResult.roomCleared, true);

  // Player walks to vacated plate / door
  player.position.x = 7;
  player.position.y = 2;
  assert.equal(player.position.x, door.position.x);
  assert.equal(player.position.y, door.position.y);
});

test("ALL_SHRINE_ROOMS contains valid room definitions with unique IDs", () => {
  assert.equal(ALL_SHRINE_ROOMS.length, 4);
  const ids = new Set(ALL_SHRINE_ROOMS.map((r) => r.id));
  assert.equal(ids.size, 4);

  for (const room of ALL_SHRINE_ROOMS) {
    assert.ok(room.width >= 8);
    assert.ok(room.height >= 6);
    assert.ok(room.objective.length > 0);
    assert.ok(room.entities.some((e) => e.renderable.shape === "avatar"));
    assert.ok(room.entities.some((e) => e.renderable.shape === "door"));
  }
});
