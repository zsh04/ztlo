import { RoomDefinition } from "../types/game";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createIceBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  createWallEntity,
  createNpcEntity,
  createLightEmitterEntity,
  createMirrorEntity,
  createReceptorEntity,
} from "../ecs/entities";

/**
 * Level 1-1 Canonical 8x6 Room Grid Specification: Shrine of Equilibrium
 * Conforms to docs/ENG_ZTLO_Level-Design-Shrine-01_20260919_v01.md
 */
export const SHRINE_00_EQUILIBRIUM: RoomDefinition = {
  id: "shrine-00",
  name: "Shrine of Equilibrium",
  width: 8,
  height: 6,
  objective: "Push the stone block onto the pressure plate to open the gate",
  hintKey: "stone_hint",
  entities: [
    createPlayerEntity("player-1", 1, 2),
    createStoneBlockEntity("stone-1", 3, 2),
    createIceBlockEntity("ice-1", 4, 4),
    createPressurePlateEntity("plate-1", 6, 2, "door-1"),
    createDoorEntity("door-1", 7, 2),
    createWallEntity("wall-interior-1", 3, 3),

    // Perimeter boundary walls
    createWallEntity("wall-top-0", 0, 0),
    createWallEntity("wall-top-1", 1, 0),
    createWallEntity("wall-top-2", 2, 0),
    createWallEntity("wall-top-3", 3, 0),
    createWallEntity("wall-top-4", 4, 0),
    createWallEntity("wall-top-5", 5, 0),
    createWallEntity("wall-top-6", 6, 0),
    createWallEntity("wall-top-7", 7, 0),

    createWallEntity("wall-bottom-0", 0, 5),
    createWallEntity("wall-bottom-1", 1, 5),
    createWallEntity("wall-bottom-2", 2, 5),
    createWallEntity("wall-bottom-3", 3, 5),
    createWallEntity("wall-bottom-4", 4, 5),
    createWallEntity("wall-bottom-5", 5, 5),
    createWallEntity("wall-bottom-6", 6, 5),
    createWallEntity("wall-bottom-7", 7, 5),

    createWallEntity("wall-left-1", 0, 1),
    createWallEntity("wall-left-2", 0, 2),
    createWallEntity("wall-left-3", 0, 3),
    createWallEntity("wall-left-4", 0, 4),

    createWallEntity("wall-right-1", 7, 1),
    createWallEntity("wall-right-3", 7, 3),
    createWallEntity("wall-right-4", 7, 4),
  ],
};

/**
 * 16:9 Prototype Trial Shrines
 */
export const SHRINE_01_STILL_WEIGHT: RoomDefinition = {
  id: "shrine-01",
  name: "Shrine of Still Weight",
  width: 16,
  height: 9,
  objective: "Push the heavy stone block onto the round pressure plate",
  hintKey: "stone_hint",
  entities: [
    createPlayerEntity("player-1", 2, 4),
    createStoneBlockEntity("stone-1", 6, 4),
    createPressurePlateEntity("plate-1", 12, 4, "door-1"),
    createDoorEntity("door-1", 14, 4),
  ],
};

export const SHRINE_02_GLACIAL_FLOW: RoomDefinition = {
  id: "shrine-02",
  name: "Shrine of Glacial Flow",
  width: 16,
  height: 9,
  objective: "Slide the frictionless ice block across the room",
  hintKey: "ice_hint",
  entities: [
    createPlayerEntity("player-1", 2, 4),
    createIceBlockEntity("ice-1", 6, 4),
    createPressurePlateEntity("plate-2", 13, 4, "door-2"),
    createDoorEntity("door-2", 14, 4),
  ],
};

export const SHRINE_03_HARMONY_GATES: RoomDefinition = {
  id: "shrine-03",
  name: "Shrine of Harmony Gates",
  width: 16,
  height: 9,
  objective: "Position both blocks to complete the dual-switch circuit",
  hintKey: "dual_hint",
  entities: [
    createPlayerEntity("player-1", 1, 4),
    createStoneBlockEntity("stone-2", 5, 2),
    createIceBlockEntity("ice-2", 5, 6),
    createPressurePlateEntity("plate-3a", 12, 2, "door-3"),
    createPressurePlateEntity("plate-3b", 13, 6, "door-3"),
    createWallEntity("wall-3", 14, 6),
    createDoorEntity("door-3", 14, 4),
  ],
};


/**
 * Level 1-5 Canonical Social-Emotional Learning Specification: Grove of Harmony
 * Conforms to docs/ENG_ZTLO_Curriculum-Progression-Shrines-1-to-5_20260919_v01.md
 * Features Forest Spirit "Sprout", impassable barrier gate, and interactive co-breathing soothing mechanic.
 */
export const SHRINE_04_GROVE_OF_HARMONY: RoomDefinition = {
  id: "shrine-04",
  name: "Grove of Harmony",
  width: 8,
  height: 6,
  objective: "Help Sprout the Forest Spirit feel calm and safe to open the grove gate",
  hintKey: "npc_hint",
  entities: [
    createPlayerEntity("player-1", 1, 2),
    createNpcEntity("sprout-1", 4, 2, "Sprout", "anxious", "co_breathing", "door-grove"),
    createDoorEntity("door-grove", 7, 2),
    createStoneBlockEntity("stone-grove", 2, 4),

    // Perimeter boundary walls
    createWallEntity("wall-top-0", 0, 0),
    createWallEntity("wall-top-1", 1, 0),
    createWallEntity("wall-top-2", 2, 0),
    createWallEntity("wall-top-3", 3, 0),
    createWallEntity("wall-top-4", 4, 0),
    createWallEntity("wall-top-5", 5, 0),
    createWallEntity("wall-top-6", 6, 0),
    createWallEntity("wall-top-7", 7, 0),

    createWallEntity("wall-bottom-0", 0, 5),
    createWallEntity("wall-bottom-1", 1, 5),
    createWallEntity("wall-bottom-2", 2, 5),
    createWallEntity("wall-bottom-3", 3, 5),
    createWallEntity("wall-bottom-4", 4, 5),
    createWallEntity("wall-bottom-5", 5, 5),
    createWallEntity("wall-bottom-6", 6, 5),
    createWallEntity("wall-bottom-7", 7, 5),

    createWallEntity("wall-left-1", 0, 1),
    createWallEntity("wall-left-2", 0, 2),
    createWallEntity("wall-left-3", 0, 3),
    createWallEntity("wall-left-4", 0, 4),

    createWallEntity("wall-right-1", 7, 1),
    createWallEntity("wall-right-3", 7, 3),
    createWallEntity("wall-right-4", 7, 4),
  ],
};

/**
 * Level 1-6 Canonical Optics Specification: Chamber of Reflections
 * Conforms to Issue #10 and docs/ENG_ZTLO_Curriculum-Progression-Shrines-1-to-5_20260919_v01.md
 * Features Light Emitter Pedestal, Rotatable Prism Mirror (45°/135°), Solar Receptor Crystal, and Sun Door.
 */
export const SHRINE_05_CHAMBER_OF_REFLECTIONS: RoomDefinition = {
  id: "shrine-05",
  name: "Chamber of Reflections",
  width: 8,
  height: 6,
  objective: "Align the sacred prism mirrors to guide radiant starlight into the solar receptor",
  hintKey: "optics_hint",
  entities: [
    createPlayerEntity("player-1", 1, 4),
    createLightEmitterEntity("emitter-1", 1, 1, "east", "#FACC15"),
    createMirrorEntity("mirror-1", 5, 1, 45), // Initial 45° angle directs beam north; 135° directs south
    createReceptorEntity("receptor-1", 5, 4, "door-reflections"),
    createDoorEntity("door-reflections", 7, 2),

    // Obstacle column
    createWallEntity("wall-col-1", 3, 2),
    createWallEntity("wall-col-2", 3, 3),

    // Perimeter boundary walls
    createWallEntity("wall-optics-t0", 0, 0),
    createWallEntity("wall-optics-t1", 1, 0),
    createWallEntity("wall-optics-t2", 2, 0),
    createWallEntity("wall-optics-t3", 3, 0),
    createWallEntity("wall-optics-t4", 4, 0),
    createWallEntity("wall-optics-t5", 5, 0),
    createWallEntity("wall-optics-t6", 6, 0),
    createWallEntity("wall-optics-t7", 7, 0),

    createWallEntity("wall-optics-b0", 0, 5),
    createWallEntity("wall-optics-b1", 1, 5),
    createWallEntity("wall-optics-b2", 2, 5),
    createWallEntity("wall-optics-b3", 3, 5),
    createWallEntity("wall-optics-b4", 4, 5),
    createWallEntity("wall-optics-b5", 5, 5),
    createWallEntity("wall-optics-b6", 6, 5),
    createWallEntity("wall-optics-b7", 7, 5),

    createWallEntity("wall-optics-l1", 0, 1),
    createWallEntity("wall-optics-l2", 0, 2),
    createWallEntity("wall-optics-l3", 0, 3),
    createWallEntity("wall-optics-l4", 0, 4),

    createWallEntity("wall-optics-r1", 7, 1),
    createWallEntity("wall-optics-r3", 7, 3),
    createWallEntity("wall-optics-r4", 7, 4),
  ],
};

export const ALL_SHRINE_ROOMS: RoomDefinition[] = [
  SHRINE_00_EQUILIBRIUM,
  SHRINE_01_STILL_WEIGHT,
  SHRINE_02_GLACIAL_FLOW,
  SHRINE_03_HARMONY_GATES,
  SHRINE_04_GROVE_OF_HARMONY,
  SHRINE_05_CHAMBER_OF_REFLECTIONS,
];
