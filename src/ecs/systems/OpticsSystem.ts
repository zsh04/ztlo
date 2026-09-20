import { Entity } from "../entities";
import { CardinalDirection } from "../components";

export interface BeamPoint {
  x: number;
  y: number;
}

export interface BeamSegment {
  from: BeamPoint;
  to: BeamPoint;
  direction: CardinalDirection;
}

export interface BeamPath {
  emitterId: string;
  beamColor: string;
  points: BeamPoint[];
  segments: BeamSegment[];
  hitReceptorId?: string;
  reflectionNodes: BeamPoint[];
}

export interface OpticsEvaluationResult {
  paths: BeamPath[];
  activatedReceptorIds: string[];
  doorsUnlocked: string[];
}

export const CARDINAL_DELTAS: Record<CardinalDirection, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
};

export class OpticsSystem {
  /**
   * 45°/135° angle reflection physics:
   * East beam hitting 45° mirror -> reflects North
   * East beam hitting 135° mirror -> reflects South
   * West beam hitting 45° mirror -> reflects South
   * West beam hitting 135° mirror -> reflects North
   * North beam hitting 45° mirror -> reflects East
   * North beam hitting 135° mirror -> reflects West
   * South beam hitting 45° mirror -> reflects West
   * South beam hitting 135° mirror -> reflects East
   */
  public static reflectBeam(
    incomingDir: CardinalDirection,
    mirrorAngle: 45 | 135 | 225 | 315
  ): CardinalDirection {
    const normAngle = ((mirrorAngle % 180) + 180) % 180; // 45 or 135
    if (normAngle === 45) {
      switch (incomingDir) {
        case "east":
          return "north";
        case "west":
          return "south";
        case "north":
          return "east";
        case "south":
          return "west";
      }
    } else if (normAngle === 135) {
      switch (incomingDir) {
        case "east":
          return "south";
        case "west":
          return "north";
        case "north":
          return "west";
        case "south":
          return "east";
      }
    }
    return incomingDir;
  }

  public static rotateMirrorAngle(
    currentAngle: 45 | 135 | 225 | 315
  ): 45 | 135 | 225 | 315 {
    switch (currentAngle) {
      case 45:
        return 135;
      case 135:
        return 225;
      case 225:
        return 315;
      case 315:
        return 45;
    }
  }

  public static rotateMirror(entity: Entity): boolean {
    if (entity.optics && entity.optics.opticsType === "mirror") {
      const cur = entity.optics.angle ?? 45;
      entity.optics.angle = this.rotateMirrorAngle(cur);
      return true;
    }
    return false;
  }

  /**
   * Raycast ray paths from all light emitters across the room grid.
   * Updates receptor activation status and door unsealing states.
   */
  public static evaluateOptics(
    entities: Entity[],
    roomWidth: number,
    roomHeight: number
  ): OpticsEvaluationResult {
    // 1. Reset all receptors
    const receptors = entities.filter(
      (e) => e.optics && e.optics.opticsType === "receptor"
    );
    for (const receptor of receptors) {
      if (receptor.optics) {
        receptor.optics.isActivated = false;
      }
    }

    const paths: BeamPath[] = [];
    const activatedReceptorIds: string[] = [];

    // Map entities by tile for quick lookup
    const entityByTile = new Map<string, Entity[]>();
    for (const e of entities) {
      const key = `${e.position.x},${e.position.y}`;
      const list = entityByTile.get(key) || [];
      list.push(e);
      entityByTile.set(key, list);
    }

    // 2. Process all emitters
    const emitters = entities.filter(
      (e) => e.optics && e.optics.opticsType === "emitter" && e.optics.isLit !== false
    );

    for (const emitter of emitters) {
      const beamColor = emitter.optics?.beamColor || "#FACC15";
      const startDir = emitter.optics?.direction || "east";
      const points: BeamPoint[] = [{ x: emitter.position.x, y: emitter.position.y }];
      const segments: BeamSegment[] = [];
      const reflectionNodes: BeamPoint[] = [];
      let hitReceptorId: string | undefined;

      let currentX = emitter.position.x;
      let currentY = emitter.position.y;
      let currentDir: CardinalDirection = startDir;

      const visited = new Set<string>();
      const maxSteps = roomWidth * roomHeight * 4;
      let steps = 0;

      while (steps < maxSteps) {
        steps++;
        const delta = CARDINAL_DELTAS[currentDir];
        const nextX = currentX + delta.dx;
        const nextY = currentY + delta.dy;

        // Check room boundary collision
        if (nextX < 0 || nextX >= roomWidth || nextY < 0 || nextY >= roomHeight) {
          points.push({ x: nextX, y: nextY });
          segments.push({
            from: { x: currentX, y: currentY },
            to: { x: nextX, y: nextY },
            direction: currentDir,
          });
          break;
        }

        const tileEntities = entityByTile.get(`${nextX},${nextY}`) || [];

        // Check for Mirror
        const mirror = tileEntities.find(
          (e) => e.optics && e.optics.opticsType === "mirror"
        );
        if (mirror && mirror.optics) {
          const mirrorAngle = mirror.optics.angle ?? 45;
          points.push({ x: nextX, y: nextY });
          segments.push({
            from: { x: currentX, y: currentY },
            to: { x: nextX, y: nextY },
            direction: currentDir,
          });
          reflectionNodes.push({ x: nextX, y: nextY });

          const stateKey = `${nextX},${nextY},${currentDir}`;
          if (visited.has(stateKey)) {
            // Beam entered an infinite reflection loop
            break;
          }
          visited.add(stateKey);

          currentDir = this.reflectBeam(currentDir, mirrorAngle);
          currentX = nextX;
          currentY = nextY;
          continue;
        }

        // Check for Receptor
        const receptor = tileEntities.find(
          (e) => e.optics && e.optics.opticsType === "receptor"
        );
        if (receptor && receptor.optics) {
          points.push({ x: nextX, y: nextY });
          segments.push({
            from: { x: currentX, y: currentY },
            to: { x: nextX, y: nextY },
            direction: currentDir,
          });
          receptor.optics.isActivated = true;
          hitReceptorId = receptor.id;
          if (!activatedReceptorIds.includes(receptor.id)) {
            activatedReceptorIds.push(receptor.id);
          }
          break;
        }

        // Check for solid Obstacle (wall, stone, ice, or locked door)
        const solidObstacle = tileEntities.find((e) => {
          if (
            e.renderable.shape === "wall" ||
            e.renderable.shape === "stone" ||
            e.renderable.shape === "ice"
          ) {
            return true;
          }
          if (e.renderable.shape === "door" && e.collider?.isSolid) {
            return true;
          }
          if (e.optics?.opticsType === "emitter") {
            return true;
          }
          return false;
        });

        if (solidObstacle) {
          points.push({ x: nextX, y: nextY });
          segments.push({
            from: { x: currentX, y: currentY },
            to: { x: nextX, y: nextY },
            direction: currentDir,
          });
          break;
        }

        // Open tile / passable tile (avatar, floor, open door, etc.)
        points.push({ x: nextX, y: nextY });
        segments.push({
          from: { x: currentX, y: currentY },
          to: { x: nextX, y: nextY },
          direction: currentDir,
        });
        currentX = nextX;
        currentY = nextY;
      }

      paths.push({
        emitterId: emitter.id,
        beamColor,
        points,
        segments,
        hitReceptorId,
        reflectionNodes,
      });
    }

    // 3. Unseal or seal target doors based on receptor activations
    const doorsUnlocked: string[] = [];
    const targetDoorIds = new Set<string>();
    for (const r of receptors) {
      if (r.optics?.targetDoorId) {
        targetDoorIds.add(r.optics.targetDoorId);
      }
    }

    for (const doorId of targetDoorIds) {
      const controllingReceptors = receptors.filter(
        (r) => r.optics?.targetDoorId === doorId
      );
      const allActivated =
        controllingReceptors.length > 0 &&
        controllingReceptors.every((r) => r.optics?.isActivated);

      const door = entities.find((e) => e.id === doorId);
      if (door && door.collider) {
        if (allActivated) {
          door.collider.isSolid = false;
          doorsUnlocked.push(doorId);
        } else {
          door.collider.isSolid = true;
        }
      }
    }

    return {
      paths,
      activatedReceptorIds,
      doorsUnlocked,
    };
  }
}
