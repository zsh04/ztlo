import { Entity } from "../entities";

export interface TriggerEvaluationResult {
  depressedPlates: string[];
  doorsUnlocked: string[];
  roomCleared: boolean;
}

export class TriggerSystem {
  static evaluate(allEntities: Entity[]): TriggerEvaluationResult {
    const plates = allEntities.filter((e) => e.trigger !== undefined);
    const doors = allEntities.filter((e) => e.renderable.shape === "door");
    const blocks = allEntities.filter((e) => e.pushable !== undefined);

    const depressedPlates: string[] = [];
    const doorsUnlocked: string[] = [];

    for (const plate of plates) {
      if (!plate.trigger) continue;

      // Check if any block rests on this plate's coordinates
      const hasBlock = blocks.some(
        (b) => b.position.x === plate.position.x && b.position.y === plate.position.y
      );

      plate.trigger.isDepressed = hasBlock;
      if (hasBlock) {
        depressedPlates.push(plate.id);
        if (plate.trigger.activatesTargetId) {
          doorsUnlocked.push(plate.trigger.activatesTargetId);
        }
      }
    }

    // A door is unlocked if any trigger points to it (or in multi-trigger, all required)
    for (const door of doors) {
      const isUnlocked = doorsUnlocked.includes(door.id);
      if (isUnlocked && door.collider) {
        door.collider.isSolid = false;
        door.renderable.colorToken = "storybook-magic-soft";
      } else if (door.collider) {
        door.collider.isSolid = true;
        door.renderable.colorToken = "storybook-muted";
      }
    }

    const roomCleared = doors.length > 0 && doors.every((d) => d.collider && !d.collider.isSolid);

    return {
      depressedPlates,
      doorsUnlocked,
      roomCleared,
    };
  }
}
