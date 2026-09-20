import { GridPoint, SocraticDialog } from "../types/game";

export type MentorState =
  | "idle_observing"
  | "idle_nudge"
  | "block_failed_push"
  | "plate_curiosity"
  | "direct_hint_request"
  | "success_affirmation"
  | "corner_trap";

export type NpcEmotionState = "anxious" | "sad" | "calm" | "joyful";

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
  userDismissed: boolean;
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

export interface NpcComponent extends Component {
  type: "npc";
  name: string;
  emotion: NpcEmotionState;
  auraColor: string; // e.g. "#F59E0B" (anxious amber) -> "#38BDF8" / "#FDE047" (calm/golden)
  soothingMechanic: "co_breathing" | "gift_offering";
  breathCountRequired?: number;
  currentBreathCount?: number;
  isSoothed: boolean;
  dialogPrompt: string;
  soothedDialog: string;
  unblocksTargetId?: string;
}


export type OpticsType = "emitter" | "mirror" | "receptor";
export type CardinalDirection = "north" | "south" | "east" | "west";

export interface OpticsComponent extends Component {
  type: "optics";
  opticsType: OpticsType;
  angle?: 45 | 135 | 225 | 315; // For mirrors (degrees)
  direction?: CardinalDirection; // For emitters
  isLit?: boolean;
  isActivated?: boolean; // For receptors
  targetDoorId?: string; // Door unsealed when receptor receives light
  beamColor?: string; // e.g. "#FACC15"
}


export type LogicGateType = "and" | "or" | "sequential";

export interface LogicGateComponent extends Component {
  type: "logicGate";
  gateType: LogicGateType;
  targetDoorId: string;
  inputEntityIds: string[];
  requiredSequence?: string[];
  currentSequence: string[];
  isSatisfied: boolean;
  conduitTiles?: Array<{ x: number; y: number }>;
}

export interface RenderableComponent extends Component {
  type: "renderable";
  shape: "avatar" | "stone" | "ice" | "plate" | "wall" | "door" | "npc" | "emitter" | "mirror" | "receptor" | "gate" | "switch";
  colorToken: string;
  zIndex: number;
}
