import { Entity } from "../entities";
import { GridPoint } from "../../types/game";
import { findPathAStar } from "../../lib/pathfinding";

export class MovementSystem {
  static planPlayerMovement(
    player: Entity,
    target: GridPoint,
    roomWidth: number,
    roomHeight: number,
    entities: Entity[]
  ): GridPoint[] {
    const isBlocked = (x: number, y: number): boolean => {
      // Find any entity at (x, y) with solid collider
      const obstacle = entities.find(
        (e) =>
          e.id !== player.id &&
          e.position.x === x &&
          e.position.y === y &&
          e.collider?.isSolid &&
          !e.collider.passableByPlayer
      );
      return Boolean(obstacle);
    };

    return findPathAStar(
      { x: player.position.x, y: player.position.y },
      target,
      roomWidth,
      roomHeight,
      isBlocked
    );
  }
}
