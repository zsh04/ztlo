import { Entity } from "../entities";
import { GridPoint } from "../../types/game";
import { findPathToGoalOrAdjacent } from "../../lib/pathfinding";

export interface StepResult {
  moved: boolean;
  finished: boolean;
  currentPos: GridPoint;
}

export class MovementSystem {
  /**
   * Evaluates whether a coordinate is out of bounds or obstructed by an impassable collider.
   */
  static isTileBlocked(
    x: number,
    y: number,
    roomWidth: number,
    roomHeight: number,
    entities: Entity[],
    ignoreEntityId?: string
  ): boolean {
    if (x < 0 || x >= roomWidth || y < 0 || y >= roomHeight) {
      return true;
    }

    return entities.some(
      (e) =>
        e.id !== ignoreEntityId &&
        e.position.x === x &&
        e.position.y === y &&
        e.collider?.isSolid &&
        !e.collider.passableByPlayer
    );
  }

  /**
   * Plans the shortest path for the player to the target coordinate.
   * If the target is a solid wall or obstacle, automatically finds the closest adjacent open tile.
   */
  static planPlayerMovement(
    player: Entity,
    target: GridPoint,
    roomWidth: number,
    roomHeight: number,
    entities: Entity[]
  ): GridPoint[] {
    const isBlocked = (x: number, y: number): boolean => {
      return MovementSystem.isTileBlocked(x, y, roomWidth, roomHeight, entities, player.id);
    };

    return findPathToGoalOrAdjacent(
      { x: player.position.x, y: player.position.y },
      target,
      roomWidth,
      roomHeight,
      isBlocked
    );
  }

  /**
   * Initializes player's MovementComponent with the planned path.
   */
  static startMovement(player: Entity, path: GridPoint[]): void {
    if (!player.movement) {
      player.movement = {
        type: "movement",
        path: [],
        target: null,
        isMoving: false,
        stepIntervalMs: 150,
      };
    }

    if (path.length <= 1) {
      player.movement.path = [];
      player.movement.target = null;
      player.movement.isMoving = false;
      return;
    }

    // path[0] is the current position; waypoints are path.slice(1)
    player.movement.path = path.slice(1);
    player.movement.target = path[path.length - 1];
    player.movement.isMoving = true;
  }

  /**
   * Advances the player by one tile along the path.
   * Dynamically re-routes if a new obstacle appeared in the player's path.
   */
  static step(
    player: Entity,
    roomWidth: number,
    roomHeight: number,
    entities: Entity[]
  ): StepResult {
    const currentPos: GridPoint = { x: player.position.x, y: player.position.y };

    if (!player.movement || player.movement.path.length === 0) {
      if (player.movement) {
        player.movement.isMoving = false;
      }
      return { moved: false, finished: true, currentPos };
    }

    let nextPoint = player.movement.path[0];

    // Dynamic obstacle collision check: if the next tile is blocked
    if (MovementSystem.isTileBlocked(nextPoint.x, nextPoint.y, roomWidth, roomHeight, entities, player.id)) {
      if (player.movement.target) {
        // Attempt dynamic re-route towards original target
        const rePlanned = MovementSystem.planPlayerMovement(
          player,
          player.movement.target,
          roomWidth,
          roomHeight,
          entities
        );

        if (rePlanned.length > 1) {
          player.movement.path = rePlanned.slice(1);
          nextPoint = player.movement.path[0];
        } else {
          // Cannot reach target; halt movement
          player.movement.isMoving = false;
          player.movement.path = [];
          return { moved: false, finished: true, currentPos };
        }
      } else {
        player.movement.isMoving = false;
        player.movement.path = [];
        return { moved: false, finished: true, currentPos };
      }
    }

    // Step forward
    player.movement.path.shift();
    player.position.previousX = player.position.x;
    player.position.previousY = player.position.y;
    player.position.x = nextPoint.x;
    player.position.y = nextPoint.y;

    const finished = player.movement.path.length === 0;
    if (finished) {
      player.movement.isMoving = false;
    }

    return {
      moved: true,
      finished,
      currentPos: { x: nextPoint.x, y: nextPoint.y },
    };
  }

  /**
   * Cancels any active movement for the player entity.
   */
  static cancelMovement(player: Entity): void {
    if (player.movement) {
      player.movement.isMoving = false;
      player.movement.path = [];
      player.movement.target = null;
    }
  }
}
