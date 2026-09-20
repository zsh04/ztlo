import test from "node:test";
import assert from "node:assert/strict";
import { LogicSystem } from "./LogicSystem";
import {
  createPlayerEntity,
  createDoorEntity,
  createLogicGateEntity,
  createFloorSwitchEntity,
  createWallEntity,
} from "../entities";
import { GameWorld } from "../world";

test("LogicSystem: AND gate requires all inputs to be active simultaneously", () => {
  const switch1 = createFloorSwitchEntity("switch-1", 2, 2, "gate-1");
  const switch2 = createFloorSwitchEntity("switch-2", 4, 2, "gate-1");
  const gate = createLogicGateEntity("gate-1", 3, 2, "and", "door-1", ["switch-1", "switch-2"]);
  const door = createDoorEntity("door-1", 7, 2);

  const entities = [switch1, switch2, gate, door];

  // 1. Both inactive
  let res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);

  // 2. Switch 1 active alone
  switch1.trigger!.isDepressed = true;
  res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);

  // 3. Switch 2 active alone
  switch1.trigger!.isDepressed = false;
  switch2.trigger!.isDepressed = true;
  res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);

  // 4. Both active concurrently
  switch1.trigger!.isDepressed = true;
  switch2.trigger!.isDepressed = true;
  res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, true);
  assert.equal(door.collider?.isSolid, false);
  assert.ok(res.doorsUnlocked.includes("door-1"));
});

test("LogicSystem: OR gate activates when at least one input is active", () => {
  const switch1 = createFloorSwitchEntity("switch-1", 2, 2, "gate-1");
  const switch2 = createFloorSwitchEntity("switch-2", 4, 2, "gate-1");
  const gate = createLogicGateEntity("gate-1", 3, 2, "or", "door-1", ["switch-1", "switch-2"]);
  const door = createDoorEntity("door-1", 7, 2);

  const entities = [switch1, switch2, gate, door];

  // Both inactive
  let res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);

  // Switch 1 active
  switch1.trigger!.isDepressed = true;
  res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, true);
  assert.equal(door.collider?.isSolid, false);

  // Re-lock when both vacated
  switch1.trigger!.isDepressed = false;
  res = LogicSystem.evaluate(entities);
  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);
});

test("LogicSystem: Sequential gate advances strictly in required order", () => {
  const switch1 = createFloorSwitchEntity("switch-1", 2, 2, "gate-1");
  const switch2 = createFloorSwitchEntity("switch-2", 4, 2, "gate-1");
  const switch3 = createFloorSwitchEntity("switch-3", 6, 2, "gate-1");
  const gate = createLogicGateEntity(
    "gate-1",
    4,
    3,
    "sequential",
    "door-1",
    ["switch-1", "switch-2", "switch-3"],
    ["switch-1", "switch-2", "switch-3"]
  );
  const door = createDoorEntity("door-1", 7, 2);

  // Step 1: correct first switch
  assert.equal(LogicSystem.processSequentialStep(gate.logicGate!, "switch-1"), true);
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1"]);
  assert.equal(gate.logicGate?.isSatisfied, false);

  // Step 2: correct second switch
  assert.equal(LogicSystem.processSequentialStep(gate.logicGate!, "switch-2"), true);
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1", "switch-2"]);
  assert.equal(gate.logicGate?.isSatisfied, false);

  // Step 3: correct third switch
  assert.equal(LogicSystem.processSequentialStep(gate.logicGate!, "switch-3"), true);
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1", "switch-2", "switch-3"]);
  assert.equal(gate.logicGate?.isSatisfied, true);

  // Evaluate doors
  const entities = [switch1, switch2, switch3, gate, door];
  LogicSystem.evaluate(entities);
  assert.equal(door.collider?.isSolid, false);
});

test("LogicSystem: Sequential gate resets sequence gently when stepped on out of order", () => {
  const gate = createLogicGateEntity(
    "gate-1",
    4,
    3,
    "sequential",
    "door-1",
    ["switch-1", "switch-2", "switch-3"],
    ["switch-1", "switch-2", "switch-3"]
  );

  // Step 1: switch-1
  LogicSystem.processSequentialStep(gate.logicGate!, "switch-1");
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1"]);

  // Step 2: switch-3 (wrong step! expected switch-2)
  const success = LogicSystem.processSequentialStep(gate.logicGate!, "switch-3");
  assert.equal(success, false);
  // Sequence gently resets
  assert.deepEqual(gate.logicGate?.currentSequence, []);
  assert.equal(gate.logicGate?.isSatisfied, false);

  // Stepping on switch-1 again cleanly begins a new sequence
  LogicSystem.processSequentialStep(gate.logicGate!, "switch-1");
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1"]);
});

test("GameWorld: Sequential gate snapshot history and gentle undo capability", () => {
  const room = {
    id: "test-logic-room",
    name: "Test Logic Room",
    width: 8,
    height: 6,
    objective: "Test logic gates",
    hintKey: "hint",
    entities: [
      createPlayerEntity("player-1", 1, 2),
      createFloorSwitchEntity("switch-1", 2, 2, "gate-1"),
      createFloorSwitchEntity("switch-2", 4, 2, "gate-1"),
      createFloorSwitchEntity("switch-3", 6, 2, "gate-1"),
      createLogicGateEntity(
        "gate-1",
        4,
        3,
        "sequential",
        "door-1",
        ["switch-1", "switch-2", "switch-3"],
        ["switch-1", "switch-2", "switch-3"]
      ),
      createDoorEntity("door-1", 7, 2),
    ],
  };

  const world = new GameWorld(room);
  world.setEntities(JSON.parse(JSON.stringify(room.entities)));

  const player = world.getPlayer()!;
  const gate = world.entities.get("gate-1")!;
  const door = world.entities.get("door-1")!;

  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);

  // 1. Walk onto switch 1 at (2, 2)
  world.startPlayerMovement([{ x: 1, y: 2 }, { x: 2, y: 2 }]);
  world.stepPlayerMovement();
  world.evaluateTriggers();
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1"]);
  assert.equal(gate.logicGate?.isSatisfied, false);

  // 2. Walk onto switch 2 at (4, 2)
  world.startPlayerMovement([{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }]);
  world.stepPlayerMovement();
  world.stepPlayerMovement();
  world.evaluateTriggers();
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1", "switch-2"]);
  assert.equal(gate.logicGate?.isSatisfied, false);

  // 3. Walk onto switch 3 at (6, 2)
  world.startPlayerMovement([{ x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }]);
  world.stepPlayerMovement();
  world.stepPlayerMovement();
  world.evaluateTriggers();
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1", "switch-2", "switch-3"]);
  assert.equal(gate.logicGate?.isSatisfied, true);
  assert.equal(door.collider?.isSolid, false);

  // 4. Test Undo rewinds to step 2 (switch-2 occupied, switch-3 unstepped)
  assert.equal(world.canUndo(), true);
  world.undoLastMove();
  assert.deepEqual(gate.logicGate?.currentSequence, ["switch-1", "switch-2"]);
  assert.equal(gate.logicGate?.isSatisfied, false);
  assert.equal(door.collider?.isSolid, true);
});
