import {
  PositionComponent,
  MovementComponent,
  ColliderComponent,
  PushableComponent,
  TriggerComponent,
  RenderableComponent,
  MentorComponent,
  NpcComponent,
  NpcEmotionState,
} from "./components";

export interface Entity {
  id: string;
  position: PositionComponent;
  movement?: MovementComponent;
  collider?: ColliderComponent;
  pushable?: PushableComponent;
  trigger?: TriggerComponent;
  mentor?: MentorComponent;
  npc?: NpcComponent;
  renderable: RenderableComponent;
}

export function createPlayerEntity(id: string, x: number, y: number): Entity {
  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    movement: {
      type: "movement",
      path: [],
      target: null,
      isMoving: false,
      stepIntervalMs: 150,
    },
    collider: { type: "collider", isSolid: true, passableByPlayer: true },
    renderable: { type: "renderable", shape: "avatar", colorToken: "storybook-text", zIndex: 10 },
  };
}

export function createStoneBlockEntity(id: string, x: number, y: number): Entity {
  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    collider: { type: "collider", isSolid: true, passableByPlayer: false },
    pushable: { type: "pushable", behavior: "discrete", isSliding: false },
    renderable: { type: "renderable", shape: "stone", colorToken: "storybook-stone", zIndex: 5 },
  };
}

export function createIceBlockEntity(id: string, x: number, y: number): Entity {
  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    collider: { type: "collider", isSolid: true, passableByPlayer: false },
    pushable: { type: "pushable", behavior: "continuous", isSliding: false },
    renderable: { type: "renderable", shape: "ice", colorToken: "storybook-ice", zIndex: 5 },
  };
}

export function createPressurePlateEntity(
  id: string,
  x: number,
  y: number,
  activatesTargetId: string
): Entity {
  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    collider: { type: "collider", isSolid: false, passableByPlayer: true },
    trigger: {
      type: "trigger",
      triggerId: id,
      isDepressed: false,
      activatesTargetId,
    },
    renderable: { type: "renderable", shape: "plate", colorToken: "storybook-interactable-soft", zIndex: 1 },
  };
}

export function createDoorEntity(id: string, x: number, y: number): Entity {
  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    collider: { type: "collider", isSolid: true, passableByPlayer: false },
    renderable: { type: "renderable", shape: "door", colorToken: "storybook-muted", zIndex: 2 },
  };
}

export function createWallEntity(id: string, x: number, y: number): Entity {
  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    collider: { type: "collider", isSolid: true, passableByPlayer: false },
    renderable: { type: "renderable", shape: "wall", colorToken: "storybook-stone-dark", zIndex: 3 },
  };
}

export function createNpcEntity(
  id: string,
  x: number,
  y: number,
  name: string = "Sprout",
  emotion: NpcEmotionState = "anxious",
  soothingMechanic: "co_breathing" | "gift_offering" = "co_breathing",
  unblocksTargetId?: string
): Entity {
  const isAnxious = emotion === "anxious";
  const isSad = emotion === "sad";
  const auraColor = isAnxious ? "#F59E0B" : isSad ? "#818CF8" : "#FDE047";

  return {
    id,
    position: { type: "position", x, y, previousX: x, previousY: y },
    collider: { type: "collider", isSolid: true, passableByPlayer: false },
    npc: {
      type: "npc",
      name,
      emotion,
      auraColor,
      soothingMechanic,
      breathCountRequired: soothingMechanic === "co_breathing" ? 1 : undefined,
      currentBreathCount: 0,
      isSoothed: false,
      dialogPrompt:
        emotion === "anxious"
          ? "The shadows felt too loud... My chest feels all tight and fluttering."
          : "I feel small and heavy... like a cloud that forgot how to float.",
      soothedDialog:
        "My heart feels soft and sunny again! The grove path is open for you, Zyra!",
      unblocksTargetId,
    },
    renderable: {
      type: "renderable",
      shape: "npc",
      colorToken: isAnxious ? "storybook-interactable" : "storybook-plate",
      zIndex: 8,
    },
  };
}
