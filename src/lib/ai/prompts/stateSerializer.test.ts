import test from "node:test";
import assert from "node:assert/strict";
import { serializeRoomState } from "./stateSerializer";
import {
  buildSocraticSystemPrompt,
  buildSocraticUserPrompt,
  containsImperativeSpoiler,
  sanitizeSocraticResponse,
  PROHIBITED_IMPERATIVE_SPOILERS,
  SOCRATIC_CORE_INSTRUCTIONS,
} from "./socraticTemplates";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createIceBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  createWallEntity,
} from "../../../ecs/entities";
import { GameWorld } from "../../../ecs/world";

test("stateSerializer: High-efficiency execution constraint (<1ms execution time)", () => {
  const player = createPlayerEntity("player-1", 2, 4);
  const stone = createStoneBlockEntity("stone-1", 6, 4);
  const ice = createIceBlockEntity("ice-1", 6, 6);
  const plate1 = createPressurePlateEntity("plate-1", 12, 4, "door-1");
  const plate2 = createPressurePlateEntity("plate-2", 12, 6, "door-1");
  const wall = createWallEntity("wall-1", 14, 6);
  const door = createDoorEntity("door-1", 14, 4);

  const entities = [player, stone, ice, plate1, plate2, wall, door];

  // Warm-up JIT
  for (let i = 0; i < 50; i++) {
    serializeRoomState(entities, 16, 9, "shrine-03", "Dual circuit test");
  }

  // Measure 200 consecutive serializations
  const iterations = 200;
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    serializeRoomState(entities, 16, 9, "shrine-03", "Dual circuit test");
  }
  const totalDurationMs = performance.now() - startTime;
  const avgDurationMs = totalDurationMs / iterations;

  assert.ok(
    avgDurationMs < 1.0,
    `Serialization took ${avgDurationMs.toFixed(4)}ms on average; must be < 1.0ms for 60 FPS guarantee`
  );
});

test("stateSerializer: Accurate entity state representation", () => {
  const player = createPlayerEntity("player-1", 2, 3);
  const stone = createStoneBlockEntity("stone-1", 5, 3);
  const ice = createIceBlockEntity("ice-1", 8, 3);
  ice.pushable!.isSliding = true;

  const plateUnpressed = createPressurePlateEntity("plate-1", 10, 3, "door-1");
  const plateWithStone = createPressurePlateEntity("plate-2", 5, 3, "door-1");
  plateWithStone.trigger!.isDepressed = true;

  const doorSealed = createDoorEntity("door-1", 14, 3);

  const entities = [player, stone, ice, plateUnpressed, plateWithStone, doorSealed];
  const serialized = serializeRoomState(entities, 16, 9, "test-room", "Activate switch");

  // Player position
  assert.equal(serialized.playerSummary, "Zyra is at (2, 3)");

  // Blocks
  assert.ok(serialized.blocksSummary.includes("Stone block at (5, 3)"));
  assert.ok(serialized.blocksSummary.includes("Ice block at (8, 3) [sliding]"));

  // Plates
  assert.ok(serialized.platesSummary.includes("Pressure plate at (10, 3) is unpressed"));
  assert.ok(serialized.platesSummary.includes("Pressure plate at (5, 3) is depressed by stone block"));

  // Door
  assert.ok(serialized.doorsSummary.includes("Gate at (14, 3) is sealed"));
  assert.equal(serialized.isRoomSolved, false);
  assert.equal(serialized.unpressedPlateCount, 1);
});

test("stateSerializer: Corner entrapment hazard detection", () => {
  const player = createPlayerEntity("player-1", 3, 3);
  // Place stone in top-left corner (0, 0)
  const trappedStone = createStoneBlockEntity("stone-trapped", 0, 0);

  const entities = [player, trappedStone];
  const serialized = serializeRoomState(entities, 16, 9, "trap-test", "Avoid corners");

  assert.equal(serialized.trapsSummary.length, 1);
  assert.ok(
    serialized.trapsSummary[0].includes("corner-trapped"),
    `Expected trap notification, got: ${serialized.trapsSummary[0]}`
  );
  assert.ok(serialized.trapsSummary[0].includes("north and west"));
});

test("stateSerializer: Door unsealed and room solved detection", () => {
  const player = createPlayerEntity("player-1", 1, 1);
  const openDoor = createDoorEntity("door-open", 14, 4);
  openDoor.collider!.isSolid = false;

  const entities = [player, openDoor];
  const serialized = serializeRoomState(entities, 16, 9, "solved-room", "Reach exit");

  assert.ok(serialized.doorsSummary.includes("Gate at (14, 4) is unsealed"));
  assert.equal(serialized.isRoomSolved, true);
});

test("GameWorld.serializeForMentor: Integrates cleanly with live world instance", () => {
  const player = createPlayerEntity("player-1", 2, 4);
  const stone = createStoneBlockEntity("stone-1", 6, 4);
  const plate = createPressurePlateEntity("plate-1", 12, 4, "door-1");
  const door = createDoorEntity("door-1", 14, 4);

  const world = new GameWorld({
    id: "world-test",
    name: "Shrine of Testing",
    width: 16,
    height: 9,
    objective: "Test objective",
    hintKey: "hint",
    entities: [player, stone, plate, door],
  });
  world.setEntities([player, stone, plate, door]);

  const mentorState = world.serializeForMentor();
  assert.equal(mentorState.roomId, "world-test");
  assert.equal(mentorState.objective, "Test objective");
  assert.ok(mentorState.rawText.includes("Zyra is at (2, 4)"));
  assert.ok(mentorState.rawText.includes("Stone block at (6, 4)"));
});

test("socraticTemplates: System and user prompt construction", () => {
  const systemPrompt = buildSocraticSystemPrompt({
    roomName: "Shrine of Still Weight",
    objective: "Push stone onto plate",
  });

  assert.ok(systemPrompt.includes("Shrine of Still Weight"));
  assert.ok(systemPrompt.includes("Push stone onto plate"));
  assert.ok(systemPrompt.includes("under 20 words"));

  const userPromptObservation = buildSocraticUserPrompt({
    serializedState: "Zyra is at (2, 4). Stone block at (6, 4). Pressure plate at (12, 4) is unpressed.",
  });
  assert.ok(userPromptObservation.includes("Zyra paused to observe"));

  const userPromptQuery = buildSocraticUserPrompt({
    serializedState: "Zyra is at (2, 4). Stone block at (6, 4).",
    userQuery: "Can I move this heavy rock?",
  });
  assert.ok(userPromptQuery.includes('Zyra asks: "Can I move this heavy rock?"'));

  const userPromptChip = buildSocraticUserPrompt({
    serializedState: "Zyra is at (2, 4). Stone block at (6, 4).",
    chipId: "look_around",
  });
  assert.ok(userPromptChip.includes('Zyra selected inquiry: "look_around"'));
});

test("socraticTemplates: Strict absence of imperative spoil keywords", () => {
  for (const phrase of PROHIBITED_IMPERATIVE_SPOILERS) {
    assert.equal(
      SOCRATIC_CORE_INSTRUCTIONS.toLowerCase().includes(phrase),
      false,
      `Core prompt must never contain spoiler: ${phrase}`
    );
  }

  // Test spoiler detector
  assert.equal(containsImperativeSpoiler("Push the block onto the switch now"), true);
  assert.equal(containsImperativeSpoiler("I wonder what happens if that stone moves?"), false);

  // Test runtime sanitizer
  const spoiledOutput = "You must push the stone onto the plate at 6, 2.";
  const sanitized = sanitizeSocraticResponse(spoiledOutput, "What do you notice around you?");
  assert.equal(sanitized, "What do you notice around you?");

  const validOutput = "I wonder where that heavy stone might rest?";
  assert.equal(sanitizeSocraticResponse(validOutput), "I wonder where that heavy stone might rest?");
});
