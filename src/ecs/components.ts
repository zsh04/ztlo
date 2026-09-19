import { GridPoint } from "../types/game";

export interface Component {
  type: string;
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
