export interface GridPoint {
  x: number;
  y: number;
}

export type EntityType = "player" | "stone_block" | "ice_block" | "pressure_plate" | "wall" | "door";

export interface EntityState {
  id: string;
  type: EntityType;
  position: GridPoint;
  targetPosition?: GridPoint;
  isMoving?: boolean;
  isSliding?: boolean;
  isTriggered?: boolean;
  activeColor?: string;
  metadata?: Record<string, unknown>;
}

import { Entity } from "../ecs/entities";

export interface RoomDefinition {
  id: string;
  name: string;
  width: number;  // Default 16
  height: number; // Default 9
  entities: Entity[];
  objective: string;
  hintKey: string;
}

export interface TouchFeedbackEvent {
  id: string;
  x: number; // grid x
  y: number; // grid y
  screenX: number;
  screenY: number;
  timestamp: number;
}

export interface SocraticDialog {
  speaker: string;
  text: string;
  promptType: "neutral" | "encourage" | "socratic_hint";
}
