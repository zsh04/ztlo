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
