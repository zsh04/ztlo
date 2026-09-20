import test from "node:test";
import assert from "node:assert/strict";
import { NpcSystem } from "./NpcSystem";
import { GameWorld } from "../world";
import {
  createPlayerEntity,
  createNpcEntity,
  createDoorEntity,
} from "../entities";
import { SHRINE_04_GROVE_OF_HARMONY, ALL_SHRINE_ROOMS } from "../../game/rooms";

test("NpcSystem: Proximity detection accurately identifies interaction zone", () => {
  const player = createPlayerEntity("player-1", 1, 2);
  const npcClose = createNpcEntity("sprout-1", 2, 2);
  const npcFar = createNpcEntity("sprout-2", 6, 4);

  assert.equal(NpcSystem.isPlayerNearNpc(player, npcClose), true);
  assert.equal(NpcSystem.isPlayerNearNpc(player, npcFar), false);
});

test("NpcSystem: NPC entity initializes with anxious amber mood aura and prompt", () => {
  const npc = createNpcEntity("sprout-1", 4, 2, "Sprout", "anxious", "co_breathing", "door-1");

  assert.equal(npc.npc?.name, "Sprout");
  assert.equal(npc.npc?.emotion, "anxious");
  assert.equal(npc.npc?.auraColor, "#F59E0B");
  assert.equal(npc.npc?.isSoothed, false);
  assert.ok(npc.npc?.dialogPrompt.includes("shadows felt too loud"));
  assert.equal(npc.npc?.unblocksTargetId, "door-1");
  assert.equal(npc.renderable.shape, "npc");
});

test("NpcSystem: Guided co-breathing calms NPC and unseals connected barrier gate", () => {
  const player = createPlayerEntity("player-1", 3, 2);
  const npc = createNpcEntity("sprout-1", 4, 2, "Sprout", "anxious", "co_breathing", "door-1");
  const door = createDoorEntity("door-1", 7, 2);
  const entities = [player, npc, door];

  // Initial state: gate is solid
  assert.equal(door.collider?.isSolid, true);

  // Complete 1 breath cycle
  const result = NpcSystem.sootheWithBreathing(npc, entities, 1);

  assert.equal(result.success, true);
  assert.equal(result.soothed, true);
  assert.equal(result.unsealedDoorId, "door-1");
  assert.equal(npc.npc?.isSoothed, true);
  assert.equal(npc.npc?.emotion, "calm");
  assert.equal(npc.npc?.auraColor, "#FDE047"); // Sunny golden glow

  // Door is now unsealed!
  assert.equal(door.collider?.isSolid, false);
});

test("NpcSystem: Offering comforting gift immediately soothes NPC into joyful state", () => {
  const player = createPlayerEntity("player-1", 3, 2);
  const npc = createNpcEntity("sprout-1", 4, 2, "Sprout", "anxious", "gift_offering", "door-1");
  const door = createDoorEntity("door-1", 7, 2);
  const entities = [player, npc, door];

  assert.equal(door.collider?.isSolid, true);

  const result = NpcSystem.sootheWithGift(npc, entities, "Lavender Wildflower");

  assert.equal(result.success, true);
  assert.equal(result.soothed, true);
  assert.equal(npc.npc?.isSoothed, true);
  assert.equal(npc.npc?.emotion, "joyful");
  assert.equal(npc.npc?.auraColor, "#FDE047");
  assert.equal(door.collider?.isSolid, false);
});

test("GameWorld: NPC soothing integration and gentle undo rewind capability", () => {
  const world = new GameWorld(SHRINE_04_GROVE_OF_HARMONY);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_04_GROVE_OF_HARMONY.entities)));

  const player = world.getPlayer()!;
  const sprout = world.getNpc("sprout-1")!;
  const door = world.getEntityList().find((e) => e.id === "door-grove")!;

  assert.equal(sprout.npc?.isSoothed, false);
  assert.equal(door.collider?.isSolid, true);

  // Player approaches Sprout
  player.position.x = 3;
  player.position.y = 2;
  assert.equal(world.isPlayerNearNpc("sprout-1"), true);

  // Soothe Sprout with co-breathing
  const sootheRes = world.sootheNpcWithBreathing("sprout-1", 1);
  assert.equal(sootheRes.success, true);
  assert.equal(sprout.npc?.isSoothed, true);
  assert.equal(door.collider?.isSolid, false);

  // Verify Undo can rewind the soothing action if needed
  assert.equal(world.canUndo(), true);
  const undone = world.undoLastMove();
  assert.equal(undone, true);
  assert.equal(sprout.npc?.isSoothed, false);
  assert.equal(door.collider?.isSolid, true);
});

test("Shrine 04: Grove of Harmony conforms to Curriculum Progression Specification", () => {
  assert.equal(SHRINE_04_GROVE_OF_HARMONY.id, "shrine-04");
  assert.equal(SHRINE_04_GROVE_OF_HARMONY.name, "Grove of Harmony");
  assert.equal(SHRINE_04_GROVE_OF_HARMONY.width, 8);
  assert.equal(SHRINE_04_GROVE_OF_HARMONY.height, 6);

  assert.ok(ALL_SHRINE_ROOMS.some((r) => r.id === "shrine-04"));

  const world = new GameWorld(SHRINE_04_GROVE_OF_HARMONY);
  world.setEntities(JSON.parse(JSON.stringify(SHRINE_04_GROVE_OF_HARMONY.entities)));

  const npcs = world.getNpcs();
  assert.equal(npcs.length, 1);
  assert.equal(npcs[0].npc?.name, "Sprout");
  assert.equal(npcs[0].npc?.soothingMechanic, "co_breathing");
});
