import { Entity } from "../entities";
import { MentorComponent, MentorState } from "../components";
import { SocraticDialog } from "../../types/game";

export class MentorSystem {
  /**
   * Constructs the initial MentorComponent state.
   */
  static createInitialState(): MentorComponent {
    return {
      type: "mentor",
      state: "idle_observing",
      idleSeconds: 0,
      unproductivePushCount: 0,
      standingOnPlateSeconds: 0,
      isBubbleOpen: false,
      currentDialog: {
        speaker: "Light Orb",
        text: "I am floating right beside you, Zyra. Take your time to look around!",
        promptType: "neutral",
      },
    };
  }

  /**
   * Main state machine evaluation loop.
   * Evaluates puzzle state, player standing duration, unproductive collisions, and idle timer.
   */
  static update(
    mentor: MentorComponent,
    entities: Entity[],
    dtSeconds: number = 1
  ): SocraticDialog {
    const doors = entities.filter((e) => e.renderable.shape === "door");
    const allDoorsUnlocked =
      doors.length > 0 && doors.every((d) => d.collider && !d.collider.isSolid);

    // 1. Success Affirmation: Door is unsealed / room cleared
    if (allDoorsUnlocked) {
      mentor.state = "success_affirmation";
      mentor.currentDialog = {
        speaker: "Light Orb",
        text: "The gate is open! Balance has returned to this room.",
        promptType: "encourage",
      };
      mentor.isBubbleOpen = true;
      return mentor.currentDialog;
    }

    // 2. Plate Curiosity: Zyra standing on a pressure plate >= 3 seconds
    const player = entities.find((e) => e.renderable.shape === "avatar");
    const plates = entities.filter((e) => e.trigger !== undefined);
    const isPlayerOnPlate =
      player &&
      plates.some(
        (p) => p.position.x === player.position.x && p.position.y === player.position.y
      );

    if (isPlayerOnPlate) {
      mentor.standingOnPlateSeconds += dtSeconds;
      if (mentor.standingOnPlateSeconds >= 3) {
        mentor.state = "plate_curiosity";
        mentor.currentDialog = {
          speaker: "Light Orb",
          text: "Look at that! The door woke up when you stepped here! What happens when walking toward the doorway?",
          promptType: "socratic_hint",
        };
        mentor.isBubbleOpen = true;
        return mentor.currentDialog;
      }
    } else {
      mentor.standingOnPlateSeconds = 0;
    }

    // 3. Repeated Unproductive Push Collisions (>= 2 failed pushes)
    if (mentor.unproductivePushCount >= 2) {
      mentor.state = "block_failed_push";
      mentor.currentDialog = {
        speaker: "Light Orb",
        text: "Hmm, the stone feels solid against the wall. Can it move in a different direction?",
        promptType: "socratic_hint",
      };
      mentor.isBubbleOpen = true;
      return mentor.currentDialog;
    }

    // 4. Idle Nudge: Player stationary without progress for >= 15 seconds
    mentor.idleSeconds += dtSeconds;
    if (mentor.idleSeconds >= 15) {
      mentor.state = "idle_nudge";
      mentor.currentDialog = MentorSystem.selectContextualHint(entities);
      mentor.isBubbleOpen = true;
      return mentor.currentDialog;
    }

    return mentor.currentDialog;
  }

  /**
   * Directly requests a gentle contextual Socratic nudge when Zyra taps the Light Orb.
   */
  static requestDirectHint(
    mentor: MentorComponent,
    entities: Entity[]
  ): SocraticDialog {
    mentor.state = "direct_hint_request";
    mentor.currentDialog = MentorSystem.selectDirectHint(entities);
    mentor.isBubbleOpen = true;
    return mentor.currentDialog;
  }

  /**
   * Records player movement, resetting the idle timer and idle nudge state.
   */
  static recordPlayerMove(mentor: MentorComponent): void {
    mentor.idleSeconds = 0;
    if (mentor.state === "idle_nudge") {
      mentor.state = "idle_observing";
    }
  }

  /**
   * Records a failed push impulse (e.g. block obstructed by wall or boundary).
   */
  static recordFailedPush(mentor: MentorComponent): void {
    mentor.unproductivePushCount += 1;
  }

  /**
   * Records a successful push, clearing unproductive push count.
   */
  static recordSuccessfulPush(mentor: MentorComponent): void {
    mentor.unproductivePushCount = 0;
    mentor.idleSeconds = 0;
    if (mentor.state === "block_failed_push") {
      mentor.state = "idle_observing";
    }
  }

  /**
   * Toggles or sets the visibility of the companion's thought/speech bubble.
   */
  static setBubbleOpen(mentor: MentorComponent, open: boolean): void {
    mentor.isBubbleOpen = open;
  }

  /**
   * Resets all timers and counters back to the initial observing state.
   */
  static reset(mentor: MentorComponent): void {
    mentor.state = "idle_observing";
    mentor.idleSeconds = 0;
    mentor.unproductivePushCount = 0;
    mentor.standingOnPlateSeconds = 0;
    mentor.isBubbleOpen = false;
    mentor.currentDialog = {
      speaker: "Light Orb",
      text: "I am floating right beside you, Zyra. Take your time to look around!",
      promptType: "neutral",
    };
  }

  /**
   * Selects contextual Socratic scaffolding based on active room entities.
   * STRICT PEDAGOGICAL RULE: No spoiling imperative commands.
   */
  static selectContextualHint(entities: Entity[]): SocraticDialog {
    const plates = entities.filter((e) => e.trigger !== undefined);
    const blocks = entities.filter((e) => e.pushable !== undefined);
    const stone = blocks.find((b) => b.pushable?.behavior === "discrete");
    const ice = blocks.find((b) => b.pushable?.behavior === "continuous");

    const depressedPlates = plates.filter((p) => p.trigger?.isDepressed);
    const hasInactivePlate = plates.some((p) => !p.trigger?.isDepressed);

    // Multi-switch circuit with partial progress
    if (plates.length > 1 && depressedPlates.length > 0 && hasInactivePlate) {
      return {
        speaker: "Light Orb",
        text: "One switch is glowing! What could help with the other switch?",
        promptType: "socratic_hint",
      };
    }

    // Inactive plate exists and stone block is in the room
    if (hasInactivePlate && stone) {
      const isStoneOnPlate = plates.some(
        (p) => p.position.x === stone.position.x && p.position.y === stone.position.y
      );
      if (!isStoneOnPlate) {
        return {
          speaker: "Light Orb",
          text: "Hmm, that plate looks lonely... I wonder what could rest on it?",
          promptType: "socratic_hint",
        };
      }
    }

    // Inactive plate exists and ice block is in the room
    if (hasInactivePlate && ice) {
      const isIceOnPlate = plates.some(
        (p) => p.position.x === ice.position.x && p.position.y === ice.position.y
      );
      if (!isIceOnPlate) {
        return {
          speaker: "Light Orb",
          text: "Ice slides so smoothly across the floor! I wonder where it stops when pushed?",
          promptType: "socratic_hint",
        };
      }
    }

    return {
      speaker: "Light Orb",
      text: "The path ahead seems quiet... I wonder where that soft light is coming from?",
      promptType: "socratic_hint",
    };
  }

  /**
   * Selects direct hint scaffolding when requested explicitly by the player.
   * STRICT PEDAGOGICAL RULE: No spoiling imperative commands.
   */
  static selectDirectHint(entities: Entity[]): SocraticDialog {
    const plates = entities.filter((e) => e.trigger !== undefined);
    const blocks = entities.filter((e) => e.pushable !== undefined);
    const stone = blocks.find((b) => b.pushable?.behavior === "discrete");
    const ice = blocks.find((b) => b.pushable?.behavior === "continuous");
    const doors = entities.filter((e) => e.renderable.shape === "door");
    const allDoorsUnlocked =
      doors.length > 0 && doors.every((d) => d.collider && !d.collider.isSolid);

    if (allDoorsUnlocked) {
      return {
        speaker: "Light Orb",
        text: "The path ahead is glowing! Shall we head through the doorway?",
        promptType: "encourage",
      };
    }

    const hasInactivePlate = plates.some((p) => !p.trigger?.isDepressed);

    if (hasInactivePlate && stone) {
      const isStoneOnPlate = plates.some(
        (p) => p.position.x === stone.position.x && p.position.y === stone.position.y
      );
      if (!isStoneOnPlate) {
        return {
          speaker: "Light Orb",
          text: "I wonder if something heavy could help keep that switch pressed?",
          promptType: "socratic_hint",
        };
      }
    }

    if (hasInactivePlate && ice) {
      return {
        speaker: "Light Orb",
        text: "Ice has very little friction! What would happen if it glided across the floor?",
        promptType: "socratic_hint",
      };
    }

    if (stone) {
      return {
        speaker: "Light Orb",
        text: "What would happen if the stone was moved over here?",
        promptType: "socratic_hint",
      };
    }

    return {
      speaker: "Light Orb",
      text: "Look around the room together with me! Do you notice anything that can be moved?",
      promptType: "socratic_hint",
    };
  }
}
