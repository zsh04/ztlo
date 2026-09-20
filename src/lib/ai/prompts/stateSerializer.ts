import { Entity } from "../../../ecs/entities";
import { MentorSystem } from "../../../ecs/systems/MentorSystem";

export interface SerializedRoomState {
  roomId?: string;
  objective?: string;
  playerSummary: string;
  blocksSummary: string[];
  platesSummary: string[];
  doorsSummary: string[];
  trapsSummary: string[];
  unpressedPlateCount: number;
  isRoomSolved: boolean;
  rawText: string;
}

/**
 * Pure ECS State Serializer.
 *
 * Converts active room entities into a concise, semantically rich representation
 * for Socratic scaffolding by the in-browser WebLLM companion.
 *
 * Strict execution constraint: Must execute in < 1ms to never drop below 60fps.
 */
export function serializeRoomState(
  entities: Entity[],
  roomWidth: number = 16,
  roomHeight: number = 9,
  roomId?: string,
  objective?: string
): SerializedRoomState {
  let playerSummary = "Zyra is exploring the chamber";
  const blocksSummary: string[] = [];
  const platesSummary: string[] = [];
  const doorsSummary: string[] = [];
  const trapsSummary: string[] = [];

  let unpressedPlateCount = 0;
  let allDoorsUnlocked = true;
  let doorCount = 0;

  // Spatial lookup for rapid entity intersection checks (<0.01ms)
  const posMap = new Map<string, Entity[]>();
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    const key = `${e.position.x},${e.position.y}`;
    const list = posMap.get(key);
    if (list) {
      list.push(e);
    } else {
      posMap.set(key, [e]);
    }
  }

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];

    // 1. Player avatar
    if (e.renderable?.shape === "avatar") {
      playerSummary = `Zyra is at (${e.position.x}, ${e.position.y})`;
    }

    // 2. Pushable blocks
    if (e.pushable) {
      const isStone = e.pushable.behavior === "discrete";
      const blockName = isStone ? "Stone block" : "Ice block";
      const slidingTag = e.pushable.isSliding ? " [sliding]" : "";
      blocksSummary.push(`${blockName} at (${e.position.x}, ${e.position.y})${slidingTag}`);

      // Check corner entrapment
      if (MentorSystem.isBlockCornerTrapped(e, entities, roomWidth, roomHeight)) {
        const isObstacle = (x: number, y: number): boolean => {
          if (x < 0 || x >= roomWidth || y < 0 || y >= roomHeight) return true;
          const cellEntities = posMap.get(`${x},${y}`);
          if (!cellEntities) return false;
          return cellEntities.some((c) => c.id !== e.id && c.collider?.isSolid && !c.pushable);
        };

        const north = isObstacle(e.position.x, e.position.y - 1);
        const south = isObstacle(e.position.x, e.position.y + 1);
        const west = isObstacle(e.position.x - 1, e.position.y);
        const east = isObstacle(e.position.x + 1, e.position.y);

        const blockedSides: string[] = [];
        if (north) blockedSides.push("north");
        if (south) blockedSides.push("south");
        if (west) blockedSides.push("west");
        if (east) blockedSides.push("east");

        trapsSummary.push(
          `${blockName} at (${e.position.x}, ${e.position.y}) is corner-trapped against ${blockedSides.join(" and ")} walls`
        );
      }
    }

    // 3. Pressure plates / triggers
    if (e.trigger !== undefined) {
      const cellEntities = posMap.get(`${e.position.x},${e.position.y}`) || [];
      const isDepressed = Boolean(e.trigger.isDepressed);

      if (isDepressed) {
        let occupant = "something";
        if (cellEntities.some((c) => c.renderable?.shape === "avatar")) {
          occupant = "Zyra";
        } else if (cellEntities.some((c) => c.pushable?.behavior === "discrete")) {
          occupant = "stone block";
        } else if (cellEntities.some((c) => c.pushable?.behavior === "continuous")) {
          occupant = "ice block";
        }
        platesSummary.push(
          `Pressure plate at (${e.position.x}, ${e.position.y}) is depressed by ${occupant}`
        );
      } else {
        unpressedPlateCount++;
        platesSummary.push(
          `Pressure plate at (${e.position.x}, ${e.position.y}) is unpressed`
        );
      }
    }

    // 4. Doors
    if (e.renderable?.shape === "door") {
      doorCount++;
      const isUnsealed = e.collider ? !e.collider.isSolid : false;
      if (!isUnsealed) {
        allDoorsUnlocked = false;
      }
      doorsSummary.push(
        `Gate at (${e.position.x}, ${e.position.y}) is ${isUnsealed ? "unsealed" : "sealed"}`
      );
    }
  }

  const isRoomSolved = doorCount > 0 && allDoorsUnlocked;

  // Compact semantic description
  const sentences: string[] = [playerSummary];
  if (blocksSummary.length > 0) sentences.push(blocksSummary.join(". "));
  if (platesSummary.length > 0) sentences.push(platesSummary.join(". "));
  if (doorsSummary.length > 0) sentences.push(doorsSummary.join(". "));
  if (trapsSummary.length > 0) sentences.push(trapsSummary.join(". "));

  const rawText = sentences.join(". ") + ".";

  return {
    roomId,
    objective,
    playerSummary,
    blocksSummary,
    platesSummary,
    doorsSummary,
    trapsSummary,
    unpressedPlateCount,
    isRoomSolved,
    rawText,
  };
}
