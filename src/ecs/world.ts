import { Entity } from "./entities";
import { GridPoint, RoomDefinition, SocraticDialog } from "../types/game";
import { MovementSystem, StepResult } from "./systems/MovementSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { TriggerSystem, TriggerEvaluationResult } from "./systems/TriggerSystem";
import { MentorSystem } from "./systems/MentorSystem";
import { MentorComponent } from "./components";

export class GameWorld {
  public width: number;
  public height: number;
  public entities: Map<string, Entity>;
  public currentRoomId: string;
  public objective: string;
  public mentor: MentorComponent;

  constructor(room: RoomDefinition) {
    this.width = room.width;
    this.height = room.height;
    this.currentRoomId = room.id;
    this.objective = room.objective;
    this.entities = new Map();
    this.mentor = MentorSystem.createInitialState();
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
    const player = this.getPlayer();
    return PhysicsSystem.executePush(
      block,
      direction,
      this.width,
      this.height,
      this.getEntityList(),
      player
    );
  }

  public evaluateTriggers(): TriggerEvaluationResult {
    return TriggerSystem.evaluate(this.getEntityList());
  }

  public tickMentor(dtSeconds: number = 1): SocraticDialog {
    return MentorSystem.update(this.mentor, this.getEntityList(), dtSeconds);
  }

  public recordMentorPlayerMove(): void {
    MentorSystem.recordPlayerMove(this.mentor);
  }

  public recordMentorFailedPush(): void {
    MentorSystem.recordFailedPush(this.mentor);
    MentorSystem.update(this.mentor, this.getEntityList(), 0);
  }

  public recordMentorSuccessfulPush(): void {
    MentorSystem.recordSuccessfulPush(this.mentor);
  }

  public requestMentorDirectHint(): SocraticDialog {
    return MentorSystem.requestDirectHint(this.mentor, this.getEntityList());
  }

  public getMentorDialog(): SocraticDialog {
    return this.mentor.currentDialog;
  }

  public isMentorBubbleOpen(): boolean {
    return this.mentor.isBubbleOpen;
  }

  public setMentorBubbleOpen(open: boolean): void {
    MentorSystem.setBubbleOpen(this.mentor, open);
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
