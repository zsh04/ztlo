import { Entity } from "./entities";
import { GridPoint, RoomDefinition } from "../types/game";
import { MovementSystem, StepResult } from "./systems/MovementSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { TriggerSystem, TriggerEvaluationResult } from "./systems/TriggerSystem";

export class GameWorld {
  public width: number;
  public height: number;
  public entities: Map<string, Entity>;
  public currentRoomId: string;
  public objective: string;

  constructor(room: RoomDefinition) {
    this.width = room.width;
    this.height = room.height;
    this.currentRoomId = room.id;
    this.objective = room.objective;
    this.entities = new Map();
  }

  public setEntities(entitiesList: Entity[]) {
    this.entities.clear();
    for (const e of entitiesList) {
      this.entities.set(e.id, e);
    }
  }

  public getEntityList(): Entity[] {
    return Array.from(this.entities.values());
  }

  public getPlayer(): Entity | undefined {
    return this.getEntityList().find((e) => e.renderable.shape === "avatar");
  }

  public planMove(target: GridPoint): GridPoint[] {
    const player = this.getPlayer();
    if (!player) return [];
    return MovementSystem.planPlayerMovement(
      player,
      target,
      this.width,
      this.height,
      this.getEntityList()
    );
  }

  public startPlayerMovement(path: GridPoint[]): void {
    const player = this.getPlayer();
    if (!player) return;
    MovementSystem.startMovement(player, path);
  }

  public stepPlayerMovement(): StepResult {
    const player = this.getPlayer();
    if (!player) {
      return { moved: false, finished: true, currentPos: { x: 0, y: 0 } };
    }
    return MovementSystem.step(player, this.width, this.height, this.getEntityList());
  }

  public cancelPlayerMovement(): void {
    const player = this.getPlayer();
    if (!player) return;
    MovementSystem.cancelMovement(player);
  }

  public pushBlock(blockId: string, direction: GridPoint): { success: boolean; newPath: GridPoint[] } {
    const block = this.entities.get(blockId);
    if (!block) return { success: false, newPath: [] };
    return PhysicsSystem.attemptPush(
      block,
      direction,
      this.width,
      this.height,
      this.getEntityList()
    );
  }

  public evaluateTriggers(): TriggerEvaluationResult {
    return TriggerSystem.evaluate(this.getEntityList());
  }

  public serializeForMentor(): Record<string, unknown> {
    const player = this.getPlayer();
    return {
      roomId: this.currentRoomId,
      playerPos: player ? { x: player.position.x, y: player.position.y } : null,
      entities: this.getEntityList().map((e) => ({
        id: e.id,
        type: e.renderable.shape,
        pos: { x: e.position.x, y: e.position.y },
        isDepressed: e.trigger?.isDepressed,
      })),
    };
  }
}
