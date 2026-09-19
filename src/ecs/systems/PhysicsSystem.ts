import { Entity } from "../entities";
import { GridPoint } from "../../types/game";

export interface PushResult {
  success: boolean;
  newPath: GridPoint[];
}

export class PhysicsSystem {
  /**
   * Evaluates whether a push impulse can be applied to a block and computes its trajectory.
   * - Discrete (StoneBlock): advances exactly 1 tile if target is walkable and free of colliders.
   * - Continuous (IceBlock): slides continuously along the impulse vector until colliding with a wall/obstacle.
   */
  static attemptPush(
    block: Entity,
    pushDirection: GridPoint,
    roomWidth: number,
    roomHeight: number,
    allEntities: Entity[]
  ): PushResult {
    if (!block.pushable) {
      return { success: false, newPath: [] };
    }

    const isOccupied = (p: GridPoint): boolean => {
      // Out of bounds acts as a solid collider boundary
      if (p.x < 0 || p.x >= roomWidth || p.y < 0 || p.y >= roomHeight) {
        return true;
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
      // StoneBlock: 1 cell push, high friction
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
      // IceBlock: frictionless momentum slide until collision
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

  /**
   * Applies the push trajectory to the block and optionally advances the pusher into the vacated spot.
   */
  static executePush(
    block: Entity,
    pushDirection: GridPoint,
    roomWidth: number,
    roomHeight: number,
    allEntities: Entity[],
    pusher?: Entity
  ): PushResult {
    const result = PhysicsSystem.attemptPush(
      block,
      pushDirection,
      roomWidth,
      roomHeight,
      allEntities
    );

    if (!result.success || result.newPath.length === 0) {
      return result;
    }

    const oldBlockX = block.position.x;
    const oldBlockY = block.position.y;
    const finalPos = result.newPath[result.newPath.length - 1];

    // Update block positions
    block.position.previousX = oldBlockX;
    block.position.previousY = oldBlockY;
    block.position.x = finalPos.x;
    block.position.y = finalPos.y;

    if (block.pushable) {
      block.pushable.isSliding = block.pushable.behavior === "continuous";
      block.pushable.slideDirection = pushDirection;
    }

    // Advance pusher into vacated tile if provided
    if (pusher) {
      pusher.position.previousX = pusher.position.x;
      pusher.position.previousY = pusher.position.y;
      pusher.position.x = oldBlockX;
      pusher.position.y = oldBlockY;
    }

    return result;
  }
}
