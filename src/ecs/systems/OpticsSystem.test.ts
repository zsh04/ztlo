import test from "node:test";
import assert from "node:assert/strict";
import {
  OpticsSystem,
  BeamPath,
  OpticsEvaluationResult,
} from "./OpticsSystem";
import {
  createLightEmitterEntity,
  createMirrorEntity,
  createReceptorEntity,
  createDoorEntity,
  createWallEntity,
  createStoneBlockEntity,
  createPlayerEntity,
} from "../entities";
import { GameWorld } from "../world";

test("OpticsSystem: 45° reflection physics conforms strictly to specification", () => {
  // East beam hitting 45° mirror -> reflects North
  assert.equal(OpticsSystem.reflectBeam("east", 45), "north");
  // West beam hitting 45° mirror -> reflects South
  assert.equal(OpticsSystem.reflectBeam("west", 45), "south");
  // North beam hitting 45° mirror -> reflects East
  assert.equal(OpticsSystem.reflectBeam("north", 45), "east");
  // South beam hitting 45° mirror -> reflects West
  assert.equal(OpticsSystem.reflectBeam("south", 45), "west");

  // 225° mirror is geometrically collinear with 45°
  assert.equal(OpticsSystem.reflectBeam("east", 225), "north");
  assert.equal(OpticsSystem.reflectBeam("west", 225), "south");
  assert.equal(OpticsSystem.reflectBeam("north", 225), "east");
  assert.equal(OpticsSystem.reflectBeam("south", 225), "west");
});

test("OpticsSystem: 135° reflection physics conforms strictly to specification", () => {
  // East beam hitting 135° mirror -> reflects South
  assert.equal(OpticsSystem.reflectBeam("east", 135), "south");
  // West beam hitting 135° mirror -> reflects North
  assert.equal(OpticsSystem.reflectBeam("west", 135), "north");
  // North beam hitting 135° mirror -> reflects West
  assert.equal(OpticsSystem.reflectBeam("north", 135), "west");
  // South beam hitting 135° mirror -> reflects East
  assert.equal(OpticsSystem.reflectBeam("south", 135), "east");

  // 315° mirror is geometrically collinear with 135°
  assert.equal(OpticsSystem.reflectBeam("east", 315), "south");
  assert.equal(OpticsSystem.reflectBeam("west", 315), "north");
  assert.equal(OpticsSystem.reflectBeam("north", 315), "west");
  assert.equal(OpticsSystem.reflectBeam("south", 315), "east");
});

test("OpticsSystem: Mirror rotation steps +90° sequentially", () => {
  assert.equal(OpticsSystem.rotateMirrorAngle(45), 135);
  assert.equal(OpticsSystem.rotateMirrorAngle(135), 225);
  assert.equal(OpticsSystem.rotateMirrorAngle(225), 315);
  assert.equal(OpticsSystem.rotateMirrorAngle(315), 45);

  const mirror = createMirrorEntity("mirror-1", 3, 3, 45);
  assert.equal(mirror.optics?.angle, 45);

  assert.equal(OpticsSystem.rotateMirror(mirror), true);
  assert.equal(mirror.optics?.angle, 135);

  assert.equal(OpticsSystem.rotateMirror(mirror), true);
  assert.equal(mirror.optics?.angle, 225);
});

test("OpticsSystem: Raycasting reflects off mirror, activates receptor, and unseals door", () => {
  const emitter = createLightEmitterEntity("emitter-1", 1, 1, "east");
  const mirror = createMirrorEntity("mirror-1", 4, 1, 135);
  const receptor = createReceptorEntity("receptor-1", 4, 4, "door-1");
  const door = createDoorEntity("door-1", 7, 2);

  const entities = [emitter, mirror, receptor, door];
  const evalResult = OpticsSystem.evaluateOptics(entities, 8, 6);

  assert.equal(evalResult.paths.length, 1);
  const path = evalResult.paths[0];
  assert.equal(path.hitReceptorId, "receptor-1");
  assert.equal(receptor.optics?.isActivated, true);
  assert.equal(door.collider?.isSolid, false);
  assert.ok(evalResult.doorsUnlocked.includes("door-1"));

  // Check reflection nodes
  assert.equal(path.reflectionNodes.length, 1);
  assert.deepEqual(path.reflectionNodes[0], { x: 4, y: 1 });
});

test("OpticsSystem: Solid obstacles (walls, blocks) block the beam from reaching mirrors or receptors", () => {
  const emitter = createLightEmitterEntity("emitter-1", 1, 1, "east");
  const wall = createWallEntity("wall-1", 3, 1);
  const mirror = createMirrorEntity("mirror-1", 4, 1, 135);
  const receptor = createReceptorEntity("receptor-1", 4, 4, "door-1");
  const door = createDoorEntity("door-1", 7, 2);

  const entities = [emitter, wall, mirror, receptor, door];
  const evalResult = OpticsSystem.evaluateOptics(entities, 8, 6);

  assert.equal(evalResult.paths.length, 1);
  const path = evalResult.paths[0];
  // Path hits wall at (3, 1) and stops
  assert.equal(path.hitReceptorId, undefined);
  assert.equal(receptor.optics?.isActivated, false);
  assert.equal(door.collider?.isSolid, true);
});

test("OpticsSystem: Receptors dynamically re-seal doors when light beam is diverted", () => {
  const emitter = createLightEmitterEntity("emitter-1", 1, 1, "east");
  const mirror = createMirrorEntity("mirror-1", 4, 1, 45); // 45° reflects north into wall
  const receptor = createReceptorEntity("receptor-1", 4, 4, "door-1");
  const door = createDoorEntity("door-1", 7, 2);

  const entities = [emitter, mirror, receptor, door];
  let evalResult = OpticsSystem.evaluateOptics(entities, 8, 6);

  // Initially unaligned: door is locked
  assert.equal(receptor.optics?.isActivated, false);
  assert.equal(door.collider?.isSolid, true);

  // Rotate mirror to 135°: reflects south into receptor
  OpticsSystem.rotateMirror(mirror);
  evalResult = OpticsSystem.evaluateOptics(entities, 8, 6);

  assert.equal(receptor.optics?.isActivated, true);
  assert.equal(door.collider?.isSolid, false);

  // Rotate mirror again to 225° (reflects north)
  OpticsSystem.rotateMirror(mirror);
  evalResult = OpticsSystem.evaluateOptics(entities, 8, 6);

  assert.equal(receptor.optics?.isActivated, false);
  assert.equal(door.collider?.isSolid, true);
});

test("GameWorld: Optics integration, mirror rotation, and gentle undo rewind", () => {
  const room = {
    id: "test-optics",
    name: "Test Optics Room",
    width: 8,
    height: 6,
    objective: "Test objective",
    hintKey: "hint",
    entities: [
      createPlayerEntity("player-1", 1, 3),
      createLightEmitterEntity("emitter-1", 1, 1, "east"),
      createMirrorEntity("mirror-1", 4, 1, 45), // Initially pointing north
      createReceptorEntity("receptor-1", 4, 4, "door-1"),
      createDoorEntity("door-1", 7, 2),
    ],
  };

  const world = new GameWorld(room);
  world.setEntities(JSON.parse(JSON.stringify(room.entities)));
  const mirror = world.entities.get("mirror-1")!;
  const receptor = world.entities.get("receptor-1")!;
  const door = world.entities.get("door-1")!;

  assert.equal(mirror.optics?.angle, 45);
  assert.equal(receptor.optics?.isActivated, false);
  assert.equal(door.collider?.isSolid, true);

  // Rotate mirror via GameWorld
  const rotated = world.rotateMirror("mirror-1");
  assert.equal(rotated, true);
  assert.equal(mirror.optics?.angle, 135);
  assert.equal(receptor.optics?.isActivated, true);
  assert.equal(door.collider?.isSolid, false);

  // Verify undo history
  assert.equal(world.canUndo(), true);
  const undone = world.undoLastMove();
  assert.equal(undone, true);

  // Mirror angle and door state are fully restored
  assert.equal(mirror.optics?.angle, 45);
  assert.equal(receptor.optics?.isActivated, false);
  assert.equal(door.collider?.isSolid, true);
});

test("OpticsSystem: Handles opposing mirrors without entering an infinite loop", () => {
  // Mirror 1 at (2, 2) angle 45, Mirror 2 at (4, 2) angle 135
  const emitter = createLightEmitterEntity("emitter-1", 0, 2, "east");
  const mirror1 = createMirrorEntity("mirror-1", 2, 2, 45); // East -> North
  const mirror2 = createMirrorEntity("mirror-2", 2, 1, 135); // North -> West
  const mirror3 = createMirrorEntity("mirror-3", 1, 1, 45); // West -> South
  const mirror4 = createMirrorEntity("mirror-4", 1, 2, 135); // South -> East (loop back to mirror1!)

  const entities = [emitter, mirror1, mirror2, mirror3, mirror4];
  const evalResult = OpticsSystem.evaluateOptics(entities, 8, 6);

  // Must finish within finite time and have a path
  assert.ok(evalResult.paths.length > 0);
  assert.ok(evalResult.paths[0].points.length > 0);
});
