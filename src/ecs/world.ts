import { Entity } from "./entities";
import { GridPoint, RoomDefinition, SocraticDialog } from "../types/game";
import { MovementSystem, StepResult } from "./systems/MovementSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { TriggerSystem, TriggerEvaluationResult } from "./systems/TriggerSystem";
import { MentorSystem } from "./systems/MentorSystem";
import { NpcSystem, SootheResult } from "./systems/NpcSystem";
import { MentorComponent, NpcEmotionState } from "./components";

export interface EntityPositionSnapshot {
  id: string;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  isSliding?: boolean;
  slideDirection?: GridPoint;
  isSolid?: boolean;
  npcState?: {
    emotion: NpcEmotionState;
    auraColor: string;
    isSoothed: boolean;
    currentBreathCount?: number;
  };
}

export interface WorldSnapshot {
  entities: EntityPositionSnapshot[];
}

export class GameWorld {
  public width: number;
  public height: number;
  public entities: Map<string, Entity>;
  public currentRoomId: string;
  public objective: string;
  public mentor: MentorComponent;
  public history: WorldSnapshot[];

  constructor(room: RoomDefinition) {
    this.width = room.width;
    this.height = room.height;
    this.currentRoomId = room.id;
    this.objective = room.objective;
    this.entities = new Map();
    this.history = [];
    this.mentor = MentorSystem.createInitialState();
  }

  public setEntities(entitiesList: Entity[]) {
    this.entities.clear();
    this.history = [];
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

  public captureSnapshot(): WorldSnapshot {
    return {
      entities: this.getEntityList().map((e) => ({
        id: e.id,
        x: e.position.x,
        y: e.position.y,
        previousX: e.position.previousX,
        previousY: e.position.previousY,
        isSliding: e.pushable?.isSliding,
        slideDirection: e.pushable?.slideDirection
          ? { ...e.pushable.slideDirection }
          : undefined,
        isSolid: e.collider?.isSolid,
        npcState: e.npc
          ? {
              emotion: e.npc.emotion,
              auraColor: e.npc.auraColor,
              isSoothed: e.npc.isSoothed,
              currentBreathCount: e.npc.currentBreathCount,
            }
          : undefined,
      })),
    };
  }

  public canUndo(): boolean {
    return this.history.length > 0;
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  public clearHistory(): void {
    this.history = [];
  }

  public undoLastMove(): boolean {
    if (this.history.length === 0) {
      return false;
    }

    const snapshot = this.history.pop()!;
    this.cancelPlayerMovement();

    for (const snap of snapshot.entities) {
      const entity = this.entities.get(snap.id);
      if (entity) {
        entity.position.x = snap.x;
        entity.position.y = snap.y;
        entity.position.previousX = snap.previousX;
        entity.position.previousY = snap.previousY;

        if (entity.pushable) {
          entity.pushable.isSliding = snap.isSliding ?? false;
          entity.pushable.slideDirection = snap.slideDirection;
        }

        if (entity.movement) {
          entity.movement.isMoving = false;
          entity.movement.path = [];
          entity.movement.target = null;
        }

        if (entity.collider && snap.isSolid !== undefined) {
          entity.collider.isSolid = snap.isSolid;
        }

        if (entity.npc && snap.npcState) {
          entity.npc.emotion = snap.npcState.emotion;
          entity.npc.auraColor = snap.npcState.auraColor;
          entity.npc.isSoothed = snap.npcState.isSoothed;
          entity.npc.currentBreathCount = snap.npcState.currentBreathCount;
        }
      }
    }

    this.evaluateTriggers();
    MentorSystem.update(this.mentor, this.getEntityList(), 0, this.width, this.height);
    return true;
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
    if (path.length > 1) {
      this.history.push(this.captureSnapshot());
    }
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
    const snapshot = this.captureSnapshot();
    const result = PhysicsSystem.executePush(
      block,
      direction,
      this.width,
      this.height,
      this.getEntityList(),
      player
    );
    if (result.success && result.newPath.length > 0) {
      this.history.push(snapshot);
      this.evaluateTriggers();
    }
    return result;
  }

  public evaluateTriggers(): TriggerEvaluationResult {
    return TriggerSystem.evaluate(this.getEntityList());
  }

  public tickMentor(dtSeconds: number = 1): SocraticDialog {
    return MentorSystem.update(
      this.mentor,
      this.getEntityList(),
      dtSeconds,
      this.width,
      this.height
    );
  }

  public recordMentorPlayerMove(): void {
    MentorSystem.recordPlayerMove(this.mentor);
  }

  public recordMentorFailedPush(): void {
    MentorSystem.recordFailedPush(this.mentor);
    MentorSystem.update(this.mentor, this.getEntityList(), 0, this.width, this.height);
  }

  public recordMentorSuccessfulPush(): void {
    MentorSystem.recordSuccessfulPush(this.mentor);
  }

  public requestMentorDirectHint(): SocraticDialog {
    return MentorSystem.requestDirectHint(this.mentor, this.getEntityList());
  }

  public answerInquiryChip(chipId: string): { dialog: SocraticDialog; triggersUndo: boolean } {
    const result = MentorSystem.handleInquiry(this.mentor, chipId);
    if (result.triggersUndo) {
      this.undoLastMove();
    }
    return result;
  }

  public answerVoiceQuery(transcript: string): { dialog: SocraticDialog; triggersUndo: boolean } {
    const result = MentorSystem.matchVoiceQueryToSocraticResponse(this.mentor, transcript);
    if (result.triggersUndo) {
      this.undoLastMove();
    }
    return result;
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
  public getNpcs(): Entity[] {
    return this.getEntityList().filter((e) => e.npc !== undefined);
  }

  public getNpc(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public isPlayerNearNpc(npcId: string, maxDistance: number = 1.5): boolean {
    const player = this.getPlayer();
    const npc = this.getNpc(npcId);
    if (!player || !npc) return false;
    return NpcSystem.isPlayerNearNpc(player, npc, maxDistance);
  }

  public sootheNpcWithBreathing(npcId: string, cycles: number = 1): SootheResult {
    const npc = this.getNpc(npcId);
    if (!npc) return { success: false, soothed: false };
    this.history.push(this.captureSnapshot());
    return NpcSystem.sootheWithBreathing(npc, this.getEntityList(), cycles);
  }

  public sootheNpcWithGift(npcId: string, giftItem: string): SootheResult {
    const npc = this.getNpc(npcId);
    if (!npc) return { success: false, soothed: false };
    this.history.push(this.captureSnapshot());
    return NpcSystem.sootheWithGift(npc, this.getEntityList(), giftItem);
  }

}
