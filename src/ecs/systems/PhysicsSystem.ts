import { Entity } from "../entities";
import { GridPoint } from "../../types/game";

export class PhysicsSystem {
  static attemptPush(
    block: Entity,
    pushDirection: GridPoint,
    roomWidth: number,
    roomHeight: number,
    allEntities: Entity[]
  ): { success: boolean; newPath: GridPoint[] } {
    if (!block.pushable) {
      return { success: false, newPath: [] };
    }

    const isOccupied = (p: GridPoint): boolean => {
      if (p.x < 0 || p.x >= roomWidth || p.y < 0 || p.y >= roomHeight) {
        return true; // Out of bounds acts as collider
      }
      return allEntities.some(
        (e) =>
          e.id !== block.id &&
          e.position.x === p.x &&
          e.position.y === p.y &&
          e.collider?.isSolid
      );
    };

    if (block.pushable.behavior === "discrete") {
      // StoneBlock: 1 cell push
      const nextPos: GridPoint = {
        x: block.position.x + pushDirection.x,
        y: block.position.y + pushDirection.y,
      };

      if (!isOccupied(nextPos)) {
        return { success: true, newPath: [nextPos] };
      }
      return { success: false, newPath: [] };
    }

    if (block.pushable.behavior === "continuous") {
      // IceBlock: slides until collision
      const path: GridPoint[] = [];
      let current: GridPoint = { x: block.position.x, y: block.position.y };

      while (true) {
        const next: GridPoint = {
          x: current.x + pushDirection.x,
          y: current.y + pushDirection.y,
        };
        if (isOccupied(next)) {
          break;
        }
        path.push(next);
        current = next;
      }

      if (path.length > 0) {
        return { success: true, newPath: path };
      }
      return { success: false, newPath: [] };
    }

    return { success: false, newPath: [] };
  }
}
