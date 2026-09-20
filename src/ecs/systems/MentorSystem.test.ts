import test from "node:test";
import assert from "node:assert/strict";
import { MentorSystem } from "./MentorSystem";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createIceBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  createWallEntity,
} from "../entities";

const PROHIBITED_IMPERATIVE_SPOILERS = [
  "push the block onto",
  "push the block to",
  "push the stone onto",
  "push the stone to",
  "move the stone to",
  "slide the ice onto",
  "you must push",
  "put the block on",
  "put the block onto",
  "you need to",
];

function assertNoImperativeSpoilers(text: string) {
  const lower = text.toLowerCase();
  for (const phrase of PROHIBITED_IMPERATIVE_SPOILERS) {
    assert.equal(
      lower.includes(phrase),
      false,
      `Dialogue "${text}" must not contain spoiling imperative phrase "${phrase}"`
    );
  }
}

test("MentorSystem: Idle timer progression and hint trigger at 15s threshold", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 1, 1);
  const entities = [player];

  assert.equal(mentor.state, "idle_observing");
  assert.equal(mentor.isBubbleOpen, false);

  // 10s idle: still observing
  MentorSystem.update(mentor, entities, 10);
  assert.equal(mentor.idleSeconds, 10);
  assert.equal(mentor.state, "idle_observing");
  assert.equal(mentor.isBubbleOpen, false);

  // Cross 15s threshold (additional 5s = 15s total)
  const hintDialog = MentorSystem.update(mentor, entities, 5);
  assert.equal(mentor.idleSeconds, 15);
  assert.equal(mentor.state, "idle_nudge");
  assert.equal(mentor.isBubbleOpen, true);
  assert.equal(hintDialog.promptType, "socratic_hint");
  assertNoImperativeSpoilers(hintDialog.text);

  // Player moves: idle timer and idle_nudge state reset
  MentorSystem.recordPlayerMove(mentor);
  assert.equal(mentor.idleSeconds, 0);
  assert.equal(mentor.state, "idle_observing");
});

test("MentorSystem: Repeated unproductive push triggers block_failed_push guidance", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 1, 1);
  const stone = createStoneBlockEntity("stone-1", 2, 1);
  const wall = createWallEntity("wall-1", 3, 1);
  const entities = [player, stone, wall];

  // 1st failed push
  MentorSystem.recordFailedPush(mentor);
  assert.equal(mentor.unproductivePushCount, 1);
  MentorSystem.update(mentor, entities, 0);
  assert.equal(mentor.state, "idle_observing");

  // 2nd failed push: triggers guidance
  MentorSystem.recordFailedPush(mentor);
  assert.equal(mentor.unproductivePushCount, 2);
  const dialog = MentorSystem.update(mentor, entities, 0);
  assert.equal(mentor.state, "block_failed_push");
  assert.equal(mentor.isBubbleOpen, true);
  assert.ok(dialog.text.includes("solid against the wall"));
  assertNoImperativeSpoilers(dialog.text);

  // Successful push resets failed push state
  MentorSystem.recordSuccessfulPush(mentor);
  assert.equal(mentor.unproductivePushCount, 0);
  assert.equal(mentor.state, "idle_observing");
});

test("MentorSystem: Plate curiosity triggered when Zyra stands on plate for >= 3s", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 4, 4);
  const plate = createPressurePlateEntity("plate-1", 4, 4, "door-1");
  const entities = [player, plate];

  // 1 second on plate
  MentorSystem.update(mentor, entities, 1);
  assert.equal(mentor.standingOnPlateSeconds, 1);
  assert.equal(mentor.state, "idle_observing");

  // 2 more seconds on plate (total 3s): plate curiosity trigger
  const dialog = MentorSystem.update(mentor, entities, 2);
  assert.equal(mentor.standingOnPlateSeconds, 3);
  assert.equal(mentor.state, "plate_curiosity");
  assert.equal(mentor.isBubbleOpen, true);
  assert.ok(dialog.text.includes("door woke up when you stepped here"));
  assertNoImperativeSpoilers(dialog.text);

  // Moving off plate resets counter
  player.position.x = 2;
  player.position.y = 2;
  MentorSystem.update(mentor, entities, 1);
  assert.equal(mentor.standingOnPlateSeconds, 0);
});

test("MentorSystem: Contextual room state awareness (inactive plate vs multi-switch)", () => {
  // Shrine 1 scenario: stone and inactive plate
  const stone = createStoneBlockEntity("stone-1", 2, 2);
  const plate1 = createPressurePlateEntity("plate-1", 6, 2, "door-1");
  const entitiesSingle = [stone, plate1];

  const singleHint = MentorSystem.selectContextualHint(entitiesSingle);
  assert.ok(singleHint.text.includes("plate looks lonely"));
  assertNoImperativeSpoilers(singleHint.text);

  // Shrine 3 scenario: 2 plates, 1 depressed, 1 inactive
  const plateA = createPressurePlateEntity("plate-a", 2, 2, "door-3");
  plateA.trigger!.isDepressed = true;
  const plateB = createPressurePlateEntity("plate-b", 6, 2, "door-3");
  plateB.trigger!.isDepressed = false;
  const entitiesMulti = [plateA, plateB, stone];

  const multiHint = MentorSystem.selectContextualHint(entitiesMulti);
  assert.ok(multiHint.text.includes("One switch is glowing"));
  assertNoImperativeSpoilers(multiHint.text);
});

test("MentorSystem: Direct hint request state transition and prompt selection", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 1, 1);
  const stone = createStoneBlockEntity("stone-1", 3, 3);
  const plate = createPressurePlateEntity("plate-1", 5, 5, "door-1");
  const entities = [player, stone, plate];

  const directDialog = MentorSystem.requestDirectHint(mentor, entities);
  assert.equal(mentor.state, "direct_hint_request");
  assert.equal(mentor.isBubbleOpen, true);
  assert.ok(directDialog.text.includes("heavy could help"));
  assertNoImperativeSpoilers(directDialog.text);
});

test("MentorSystem: Success affirmation triggers when room is cleared", () => {
  const mentor = MentorSystem.createInitialState();
  const door = createDoorEntity("door-1", 7, 2);
  door.collider!.isSolid = false; // Door unlocked / open
  const entities = [door];

  const dialog = MentorSystem.update(mentor, entities, 1);
  assert.equal(mentor.state, "success_affirmation");
  assert.equal(mentor.isBubbleOpen, true);
  assert.ok(dialog.text.includes("The gate is open"));
  assertNoImperativeSpoilers(dialog.text);
});

test("MentorSystem: Strict absence of imperative spoil keywords across all prompts", () => {
  const entitiesList = [
    createPlayerEntity("p", 0, 0),
    createStoneBlockEntity("s", 1, 1),
    createIceBlockEntity("i", 2, 2),
    createPressurePlateEntity("pl", 3, 3, "d"),
    createDoorEntity("d", 4, 4),
  ];

  const contextualHint = MentorSystem.selectContextualHint(entitiesList);
  assertNoImperativeSpoilers(contextualHint.text);

  const directHint = MentorSystem.selectDirectHint(entitiesList);
  assertNoImperativeSpoilers(directHint.text);

  const initial = MentorSystem.createInitialState();
  assertNoImperativeSpoilers(initial.currentDialog.text);
});

test("MentorSystem: Corner entrapment detection prompts gentle rewind", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 1, 0);
  // Place stone at (0, 0) in a 16x9 room - bounded by x=0 (West) and y=0 (North)
  const stone = createStoneBlockEntity("stone-1", 0, 0);
  const entities = [player, stone];

  const dialog = MentorSystem.update(mentor, entities, 1, 16, 9);
  assert.equal(mentor.state, "corner_trap");
  assert.equal(mentor.isBubbleOpen, true);
  assert.equal(
    dialog.text,
    "Oops, that corner is tight! Would you like to rewind one step together?"
  );
  assertNoImperativeSpoilers(dialog.text);

  // When block is moved out of corner, corner_trap reverts
  stone.position.x = 5;
  stone.position.y = 5;
  MentorSystem.update(mentor, entities, 0, 16, 9);
  assert.equal(mentor.state, "idle_observing");
});

test("MentorSystem: Block resting on a pressure plate is NOT treated as corner-trapped", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 1, 0);
  // Stone at corner (0, 0), but resting on a pressure plate at (0, 0)
  const stone = createStoneBlockEntity("stone-1", 0, 0);
  const plate = createPressurePlateEntity("plate-1", 0, 0, "door-1");
  const entities = [player, stone, plate];

  MentorSystem.update(mentor, entities, 1, 16, 9);
  assert.notEqual(mentor.state, "corner_trap");
});

test("MentorSystem: Pre-defined Socratic inquiry chips provide guidance without spoilers", () => {
  const mentor = MentorSystem.createInitialState();

  // Chip 1: "What should we look for?"
  const res1 = MentorSystem.handleInquiry(mentor, "look_for");
  assert.equal(mentor.state, "direct_hint_request");
  assert.equal(mentor.isBubbleOpen, true);
  assert.equal(res1.triggersUndo, false);
  assert.ok(
    res1.dialog.text.includes("Look closely at the floor! Do you see any special stones or plates that look like they need a hug?")
  );
  assertNoImperativeSpoilers(res1.dialog.text);

  // Chip 2: "Why did the block stop?"
  const res2 = MentorSystem.handleInquiry(mentor, "why_stop");
  assert.equal(res2.triggersUndo, false);
  assert.ok(
    res2.dialog.text.includes("Heavy stones love the floor and stop quickly, but ice loves to slide!")
  );
  assertNoImperativeSpoilers(res2.dialog.text);

  // Chip 3: "Can we take a step back?"
  const res3 = MentorSystem.handleInquiry(mentor, "step_back");
  assert.equal(res3.triggersUndo, true);
  assert.equal(
    res3.dialog.text,
    "Of course! Let's take one step back together."
  );
  assertNoImperativeSpoilers(res3.dialog.text);
});

test("GameWorld: undoLastMove restores coordinates without clearing room state", () => {
  const { GameWorld } = require("../world");
  const room = {
    id: "test-room",
    name: "Test Room",
    width: 16,
    height: 9,
    objective: "Test objective",
    hintKey: "test",
    entities: [],
  };

  const world = new GameWorld(room);
  const player = createPlayerEntity("player-1", 2, 4);
  const stone = createStoneBlockEntity("stone-1", 3, 4);
  const plate = createPressurePlateEntity("plate-1", 4, 4, "door-1");
  const door = createDoorEntity("door-1", 10, 4);
  world.setEntities([player, stone, plate, door]);

  assert.equal(world.canUndo(), false);

  // Push stone East: player pushes stone from (3, 4) to (4, 4) onto plate!
  const pushResult = world.pushBlock("stone-1", { x: 1, y: 0 });
  assert.equal(pushResult.success, true);
  assert.equal(stone.position.x, 4);
  assert.equal(stone.position.y, 4);
  assert.equal(plate.trigger?.isDepressed, true);
  assert.equal(door.collider?.isSolid, false); // Door opened!
  assert.equal(world.canUndo(), true);

  // Now execute Undo
  const undoSuccess = world.undoLastMove();
  assert.equal(undoSuccess, true);
  assert.equal(stone.position.x, 3);
  assert.equal(stone.position.y, 4);
  assert.equal(plate.trigger?.isDepressed, false);
  assert.equal(door.collider?.isSolid, true); // Door is closed again
  assert.equal(world.canUndo(), false);
});

test("GameWorld: answerInquiryChip step_back triggers gentle undo", () => {
  const { GameWorld } = require("../world");
  const room = {
    id: "test-room",
    name: "Test Room",
    width: 16,
    height: 9,
    objective: "Test objective",
    hintKey: "test",
    entities: [],
  };

  const world = new GameWorld(room);
  const player = createPlayerEntity("player-1", 2, 4);
  const stone = createStoneBlockEntity("stone-1", 3, 4);
  world.setEntities([player, stone]);

  // Push stone
  world.pushBlock("stone-1", { x: 1, y: 0 });
  assert.equal(stone.position.x, 4);
  assert.equal(world.canUndo(), true);

  // Child asks "Can we take a step back?"
  const inquiryResult = world.answerInquiryChip("step_back");
  assert.equal(inquiryResult.triggersUndo, true);
  assert.equal(inquiryResult.dialog.text, "Of course! Let's take one step back together.");
  // Stone restored back to 3
  assert.equal(stone.position.x, 3);
  assert.equal(world.canUndo(), false);
});

test("MentorSystem: User dismissal keeps dialog closed on subsequent ticks until new action", () => {
  const mentor = MentorSystem.createInitialState();
  const player = createPlayerEntity("player-1", 1, 1);
  const entities = [player];

  // 15 seconds idle: triggers idle nudge and opens bubble
  MentorSystem.update(mentor, entities, 15);
  assert.equal(mentor.isBubbleOpen, true);
  assert.equal(mentor.state, "idle_nudge");

  // User explicitly closes the thought bubble
  MentorSystem.setBubbleOpen(mentor, false);
  assert.equal(mentor.isBubbleOpen, false);
  assert.equal(mentor.userDismissed, true);
  assert.equal(mentor.idleSeconds, 0);

  // Subsequent tick occurs: bubble MUST NOT auto-reopen
  MentorSystem.update(mentor, entities, 20);
  assert.equal(mentor.isBubbleOpen, false);

  // Subsequent tick with trapped block: bubble MUST NOT auto-reopen if dismissed
  const stoneCorner = createStoneBlockEntity("stone-1", 0, 0);
  const trappedEntities = [player, stoneCorner];
  MentorSystem.update(mentor, trappedEntities, 5, 16, 9);
  assert.equal(mentor.isBubbleOpen, false);

  // Action occurs: Player moves -> clears dismissal flag
  MentorSystem.recordPlayerMove(mentor);
  assert.equal(mentor.userDismissed, false);

  // Next update with corner entrapment can now alert the player
  MentorSystem.update(mentor, trappedEntities, 1, 16, 9);
  assert.equal(mentor.isBubbleOpen, true);
  assert.equal(mentor.state, "corner_trap");

  // User closes again
  MentorSystem.setBubbleOpen(mentor, false);
  assert.equal(mentor.isBubbleOpen, false);
  assert.equal(mentor.userDismissed, true);

  // Direct user tap on Light Orb overrides dismissal and reopens
  MentorSystem.requestDirectHint(mentor, trappedEntities);
  assert.equal(mentor.isBubbleOpen, true);
  assert.equal(mentor.userDismissed, false);
});

test("MentorSystem: Natural language voice query matches Socratic responses without spoilers", () => {
  const mentor = MentorSystem.createInitialState();

  // Query 1: Child says "Can we step back, I made a mistake"
  const v1 = MentorSystem.matchVoiceQueryToSocraticResponse(mentor, "can we step back, I made a mistake");
  assert.equal(v1.triggersUndo, true);
  assert.ok(v1.dialog.text.includes("Let's take one step back together"));
  assertNoImperativeSpoilers(v1.dialog.text);

  // Query 2: Child says "why did the stone block stop moving"
  const v2 = MentorSystem.matchVoiceQueryToSocraticResponse(mentor, "why did the stone block stop moving?");
  assert.equal(v2.triggersUndo, false);
  assert.ok(v2.dialog.text.includes("Heavy stones love the floor"));
  assertNoImperativeSpoilers(v2.dialog.text);

  // Query 3: Child says "where is the switch to open the door"
  const v3 = MentorSystem.matchVoiceQueryToSocraticResponse(mentor, "where is the switch to open the door");
  assert.equal(v3.triggersUndo, false);
  assert.ok(v3.dialog.text.includes("Look closely at the floor!"));
  assertNoImperativeSpoilers(v3.dialog.text);

  // Query 4: General question "hello little orb"
  const v4 = MentorSystem.matchVoiceQueryToSocraticResponse(mentor, "hello little orb");
  assert.equal(v4.triggersUndo, false);
  assert.ok(v4.dialog.text.includes("Look around the room together with me"));
  assertNoImperativeSpoilers(v4.dialog.text);
});

test("GameWorld: answerVoiceQuery routes voice input into Socratic guidance and undo", () => {
  const { GameWorld } = require("../world");
  const room = {
    id: "test-room",
    name: "Test Room",
    width: 16,
    height: 9,
    objective: "Test objective",
    hintKey: "test",
    entities: [],
  };

  const world = new GameWorld(room);
  const player = createPlayerEntity("player-1", 2, 4);
  const stone = createStoneBlockEntity("stone-1", 3, 4);
  world.setEntities([player, stone]);

  // Push stone to x=4
  world.pushBlock("stone-1", { x: 1, y: 0 });
  assert.equal(stone.position.x, 4);
  assert.equal(world.canUndo(), true);

  // Child speaks aloud: "I'm stuck in the corner, please rewind"
  const res = world.answerVoiceQuery("I'm stuck in the corner, please rewind");
  assert.equal(res.triggersUndo, true);
  assert.equal(stone.position.x, 3);
  assert.equal(world.canUndo(), false);
});
