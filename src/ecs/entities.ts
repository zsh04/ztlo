import {
  PositionComponent,
  MovementComponent,
  ColliderComponent,
  PushableComponent,
  TriggerComponent,
  RenderableComponent,
} from "./components";

export interface Entity {
  id: string;
  position: PositionComponent;
  movement?: MovementComponent;
  collider?: ColliderComponent;
  pushable?: PushableComponent;
  trigger?: TriggerComponent;
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
