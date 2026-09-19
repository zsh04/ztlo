import { GridPoint, SocraticDialog } from "../types/game";

export type MentorState =
  | "idle_observing"
  | "idle_nudge"
  | "block_failed_push"
  | "plate_curiosity"
  | "direct_hint_request"
  | "success_affirmation";

export interface Component {
  type: string;
}

export interface MentorComponent extends Component {
  type: "mentor";
  state: MentorState;
  idleSeconds: number;
  unproductivePushCount: number;
  standingOnPlateSeconds: number;
  isBubbleOpen: boolean;
  currentDialog: SocraticDialog;
}

export interface PositionComponent extends Component {
  type: "position";
  x: number;
  y: number;
  previousX: number;
  previousY: number;
}

export interface ColliderComponent extends Component {
  type: "collider";
  isSolid: boolean;
  passableByPlayer: boolean;
}

export interface MovementComponent extends Component {
  type: "movement";
  path: GridPoint[];
  target: GridPoint | null;
  isMoving: boolean;
  stepIntervalMs: number;
}

export interface PushableComponent extends Component {
  type: "pushable";
  behavior: "discrete" | "continuous";
  isSliding: boolean;
  slideDirection?: GridPoint;
}

export interface TriggerComponent extends Component {
  type: "trigger";
  triggerId: string;
  isDepressed: boolean;
  activatesTargetId: string;
}

export interface RenderableComponent extends Component {
  type: "renderable";
  shape: "avatar" | "stone" | "ice" | "plate" | "wall" | "door";
  colorToken: string;
  zIndex: number;
}
