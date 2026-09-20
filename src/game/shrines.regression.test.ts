import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld } from "../ecs/world";
import {
  ALL_SHRINE_ROOMS,
  SHRINE_00_EQUILIBRIUM,
  SHRINE_01_STILL_WEIGHT,
  SHRINE_02_GLACIAL_FLOW,
  SHRINE_03_HARMONY_GATES,
} from "./rooms";

test("Shrine 00 (Equilibrium, 8x6): Discrete stone push, obstacle collision, and door unsealing", () => {
  const world = new GameWorld(SHRINE_00_EQUILIBRIUM);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_00_EQUILIBRIUM.entities)));

  const stone = world.entities.get("stone-1")!;
  const plate = world.entities.get("plate-1")!;
  const door = world.entities.get("door-1")!;

  assert.equal(stone.position.x, 3);
  assert.equal(stone.position.y, 2);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);

  // Attempt to push stone down (South) into wall-interior-1 at (3, 3) -> should fail
  const blockedPush = world.pushBlock("stone-1", { x: 0, y: 1 });
  assert.equal(blockedPush.success, false);
  assert.equal(stone.position.x, 3);
  assert.equal(stone.position.y, 2);

  // Push stone East step-by-step: 3 -> 4 -> 5 -> 6 (onto plate at 6, 2)
  const push1 = world.pushBlock("stone-1", { x: 1, y: 0 });
  assert.equal(push1.success, true);
  assert.equal(stone.position.x, 4);

  const push2 = world.pushBlock("stone-1", { x: 1, y: 0 });
  assert.equal(push2.success, true);
  assert.equal(stone.position.x, 5);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);

  const push3 = world.pushBlock("stone-1", { x: 1, y: 0 });
  assert.equal(push3.success, true);
  assert.equal(stone.position.x, 6);
  assert.equal(stone.position.y, 2);

  // Plate is now depressed and door is unsealed!
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false);

  // Multi-step Undo: verify reversing moves restores initial state
  assert.equal(world.canUndo(), true);
  assert.equal(world.getHistoryLength(), 3);

  world.undoLastMove();
  assert.equal(stone.position.x, 5);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);

  world.undoLastMove();
  assert.equal(stone.position.x, 4);

  world.undoLastMove();
  assert.equal(stone.position.x, 3);
  assert.equal(stone.position.y, 2);
  assert.equal(world.canUndo(), false);
});

test("Shrine 01 (Still Weight, 16x9): Heavy stone discrete push to plate and door unsealing", () => {
  const world = new GameWorld(SHRINE_01_STILL_WEIGHT);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_01_STILL_WEIGHT.entities)));

  const stone = world.entities.get("stone-1")!;
  const plate = world.entities.get("plate-1")!;
  const door = world.entities.get("door-1")!;

  assert.equal(stone.position.x, 6);
  assert.equal(stone.position.y, 4);
  assert.equal(plate.position.x, 12);
  assert.equal(door.collider?.isSolid, true);

  // Push stone 6 times East to reach plate at (12, 4)
  for (let step = 1; step <= 6; step++) {
    const res = world.pushBlock("stone-1", { x: 1, y: 0 });
    assert.equal(res.success, true);
    assert.equal(stone.position.x, 6 + step);
  }

  assert.equal(stone.position.x, 12);
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false);

  // Undo restores stone back to 11, closing door
  world.undoLastMove();
  assert.equal(stone.position.x, 11);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);
});

test("Shrine 02 (Glacial Flow, 16x9): Frictionless ice block continuous sliding across room", () => {
  const world = new GameWorld(SHRINE_02_GLACIAL_FLOW);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_02_GLACIAL_FLOW.entities)));

  const ice = world.entities.get("ice-1")!;
  const plate = world.entities.get("plate-2")!;
  const door = world.entities.get("door-2")!;

  assert.equal(ice.position.x, 6);
  assert.equal(ice.position.y, 4);
  assert.equal(plate.position.x, 13);
  assert.equal(door.position.x, 14);
  assert.equal(door.collider?.isSolid, true);

  // Single impulse East causes continuous sliding across 7 tiles:
  // Stopped by solid door-2 at (14, 4), coming to rest on plate-2 at (13, 4)
  const pushRes = world.pushBlock("ice-1", { x: 1, y: 0 });
  assert.equal(pushRes.success, true);
  assert.equal(ice.position.x, 13);
  assert.equal(ice.position.y, 4);

  // Plate activated, door unsealed!
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false);

  // Undo restores ice block back across the floor to start point (6, 4)
  world.undoLastMove();
  assert.equal(ice.position.x, 6);
  assert.equal(ice.position.y, 4);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);
});

test("Shrine 03 (Harmony Gates, 16x9): Multi-switch circuit with stone + ice + wall obstacle", () => {
  const world = new GameWorld(SHRINE_03_HARMONY_GATES);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_03_HARMONY_GATES.entities)));

  const stone = world.entities.get("stone-2")!;
  const ice = world.entities.get("ice-2")!;
  const plateA = world.entities.get("plate-3a")!; // (12, 2)
  const plateB = world.entities.get("plate-3b")!; // (13, 6)
  const door = world.entities.get("door-3")!;     // (14, 4)

  assert.equal(plateA.trigger?.isDepressed, false);
  assert.equal(plateB.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true);

  // Step 1: Slide ice block East from (5, 6)
  // Stops at (13, 6) in front of solid wall-3 at (14, 6)
  const icePush = world.pushBlock("ice-2", { x: 1, y: 0 });
  assert.equal(icePush.success, true);
  assert.equal(ice.position.x, 13);
  assert.equal(ice.position.y, 6);

  // Switch B is now active, but Switch A is not! Door MUST remain locked!
  assert.equal(plateB.trigger?.isDepressed, true);
  assert.equal(plateA.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true, "Door must stay sealed when only 1 of 2 switches is depressed");

  // Step 2: Push stone block East toward plate-3a at (12, 2)
  // Initial stone pos: (5, 2) -> 7 pushes East to reach 12
  for (let i = 1; i <= 7; i++) {
    world.pushBlock("stone-2", { x: 1, y: 0 });
  }
  assert.equal(stone.position.x, 12);
  assert.equal(stone.position.y, 2);

  // Both switches are now active -> Multi-switch circuit complete!
  assert.equal(plateA.trigger?.isDepressed, true);
  assert.equal(plateB.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false, "Door must unseal when all switches are active");

  // Undo one stone push: stone moves to 11 -> door re-locks immediately!
  world.undoLastMove();
  assert.equal(stone.position.x, 11);
  assert.equal(plateA.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true, "Door must immediately re-seal if either switch is vacated");
});

test("Regression: Dismissing corner-trap dialogue keeps it closed while moving avatar", () => {
  const world = new GameWorld(SHRINE_00_EQUILIBRIUM);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_00_EQUILIBRIUM.entities)));

  // Force stone into corner at (1, 1) bounded by North wall (1, 0) and West wall (0, 1)
  const stone = world.entities.get("stone-1")!;
  stone.position.x = 1;
  stone.position.y = 1;

  // Inactivity/mentor tick triggers corner entrapment dialogue
  const dialog = world.tickMentor(1);
  assert.equal(world.isMentorBubbleOpen(), true);
  assert.ok(dialog.text.includes("corner is tight"));

  // Child dismisses the dialogue bubble
  world.setMentorBubbleOpen(false);
  assert.equal(world.isMentorBubbleOpen(), false);

  // Child walks avatar to several tiles
  world.recordMentorPlayerMove();
  assert.equal(world.isMentorBubbleOpen(), false);

  // Subsequent mentor update ticks MUST NOT resurrect the dismissed corner-trap dialogue
  world.tickMentor(1);
  assert.equal(world.isMentorBubbleOpen(), false);

  world.tickMentor(5);
  assert.equal(world.isMentorBubbleOpen(), false);

  // Actionable trigger: child pushes a block
  world.pushBlock("stone-1", { x: 0, y: -1 }); // Blocked push into wall
  world.recordMentorFailedPush();

  // Now actionable feedback is permitted
  assert.equal(world.isMentorBubbleOpen(), true);
});
