import { SocraticDialog } from "../types/game";
import { Entity } from "../ecs/entities";

export class SocraticEngine {
  static evaluateState(
    entities: Entity[],
    secondsSinceLastMove: number
  ): SocraticDialog {
    const blocks = entities.filter((e) => e.pushable !== undefined);
    const plates = entities.filter((e) => e.trigger !== undefined);
    const doors = entities.filter((e) => e.renderable.shape === "door");

    const allDoorsUnlocked = doors.length > 0 && doors.every((d) => d.collider && !d.collider.isSolid);

    if (allDoorsUnlocked) {
      return {
        speaker: "Light Orb",
        text: "The path is glowing and open! Let's walk through to the next room!",
        promptType: "encourage",
      };
    }

    const depressedPlates = plates.filter((p) => p.trigger?.isDepressed);

    // Check for stone block misaligned with plate
    const stone = blocks.find((b) => b.pushable?.behavior === "discrete");
    const ice = blocks.find((b) => b.pushable?.behavior === "continuous");

    if (stone && plates.length > 0) {
      const activePlate = plates[0];
      const isStoneOnPlate = stone.position.x === activePlate.position.x && stone.position.y === activePlate.position.y;
      if (!isStoneOnPlate && secondsSinceLastMove >= 10) {
        return {
          speaker: "Light Orb",
          text: "What happens if we push the heavy block one more time toward the round plate?",
          promptType: "socratic_hint",
        };
      }
    }

    if (ice && plates.length > 0) {
      const activePlate = plates[0];
      const isIceOnPlate = ice.position.x === activePlate.position.x && ice.position.y === activePlate.position.y;
      if (!isIceOnPlate && secondsSinceLastMove >= 10) {
        return {
          speaker: "Light Orb",
          text: "Ice slides really fast! Is there something we can put in its way to stop it earlier?",
          promptType: "socratic_hint",
        };
      }
    }

    if (depressedPlates.length > 0 && depressedPlates.length < plates.length) {
      return {
        speaker: "Light Orb",
        text: "One switch is activated! Can you find where the second switch is hidden?",
        promptType: "socratic_hint",
      };
    }

    return {
      speaker: "Light Orb",
      text: "Tap anywhere on the floor to guide Zyra. I'm right here beside you!",
      promptType: "neutral",
    };
  }
}
