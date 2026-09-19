import { Entity } from "../entities";

export interface TriggerEvaluationResult {
  depressedPlates: string[];
  doorsUnlocked: string[];
  roomCleared: boolean;
}

export class TriggerSystem {
  /**
   * Evaluates all pressure plates and sanctuary doors in the world.
   * Activates plates when occupied by Zyra, StoneBlock, or IceBlock.
   * Unlocks doors when all targeting plates are depressed.
   */
  static evaluate(allEntities: Entity[]): TriggerEvaluationResult {
    const plates = allEntities.filter((e) => e.trigger !== undefined);
    const doors = allEntities.filter((e) => e.renderable.shape === "door");

    const depressedPlates: string[] = [];
    const doorsUnlocked: string[] = [];

    // Evaluate pressure plates: occupied by Zyra (avatar), StoneBlock, or IceBlock
    for (const plate of plates) {
      if (!plate.trigger) continue;

      const isOccupied = allEntities.some(
        (e) =>
          e.id !== plate.id &&
          (e.renderable.shape === "avatar" || e.pushable !== undefined) &&
          e.position.x === plate.position.x &&
          e.position.y === plate.position.y
      );

      plate.trigger.isDepressed = isOccupied;
      if (isOccupied) {
        depressedPlates.push(plate.id);
      }
    }

    // Evaluate doors: a door unlocks when ALL pressure plates targeting it are depressed
    for (const door of doors) {
      const targetingPlates = plates.filter(
        (p) => p.trigger && p.trigger.activatesTargetId === door.id
      );

      if (targetingPlates.length > 0) {
        const isUnlocked = targetingPlates.every((p) => p.trigger?.isDepressed);
        if (isUnlocked) {
          doorsUnlocked.push(door.id);
        }

        if (door.collider) {
          door.collider.isSolid = !isUnlocked;
          door.renderable.colorToken = isUnlocked ? "storybook-magic-soft" : "storybook-muted";
        }
      } else {
        // Standalone door without targeting triggers
        if (door.collider && !door.collider.isSolid) {
          doorsUnlocked.push(door.id);
        }
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
