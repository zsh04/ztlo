import { SocraticDialog } from "../types/game";
import { Entity } from "../ecs/entities";
import { MentorSystem } from "../ecs/systems/MentorSystem";

export class SocraticEngine {
  static evaluateState(
    entities: Entity[],
    secondsSinceLastMove: number
  ): SocraticDialog {
    const mentor = MentorSystem.createInitialState();
    mentor.idleSeconds = secondsSinceLastMove;
    return MentorSystem.update(mentor, entities, 0);
  }
}
