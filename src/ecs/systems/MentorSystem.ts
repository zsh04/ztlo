import { Entity } from "../entities";
import { MentorComponent, MentorState } from "../components";
import { SocraticDialog } from "../../types/game";

export interface InquiryChip {
  id: string;
  label: string;
  response: string;
}

export const SOCRATIC_INQUIRY_CHIPS: InquiryChip[] = [
  {
    id: "look_for",
    label: "What should we look for?",
    response:
      "Look closely at the floor! Do you see any special stones or plates that look like they need a hug?",
  },
  {
    id: "why_stop",
    label: "Why did the block stop?",
    response:
      "Heavy stones love the floor and stop quickly, but ice loves to slide! Where do you think it wants to go?",
  },
  {
    id: "step_back",
    label: "Can we take a step back?",
    response: "Of course! Let's take one step back together.",
  },
];

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
      userDismissed: false,
      currentDialog: {
        speaker: "Light Orb",
        text: "I am floating right beside you, Zyra. Take your time to look around!",
        promptType: "neutral",
      },
    };
  }

  /**
   * Main state machine evaluation loop.
   * Evaluates puzzle state, corner traps, player standing duration, unproductive collisions, and idle timer.
   */
  static update(
    mentor: MentorComponent,
    entities: Entity[],
    dtSeconds: number = 1,
    roomWidth: number = 16,
    roomHeight: number = 9
  ): SocraticDialog {
    const doors = entities.filter((e) => e.renderable.shape === "door");
    const allDoorsUnlocked =
      doors.length > 0 && doors.every((d) => d.collider && !d.collider.isSolid);

    // 1. Success Affirmation: Door is unsealed / room cleared
    if (allDoorsUnlocked) {
      mentor.userDismissed = false;
      mentor.state = "success_affirmation";
      mentor.currentDialog = {
        speaker: "Light Orb",
        text: "The gate is open! Balance has returned to this room.",
        promptType: "encourage",
      };
      mentor.isBubbleOpen = true;
      return mentor.currentDialog;
    }

    const isCornerTrapped = MentorSystem.isAnyBlockCornerTrapped(entities, roomWidth, roomHeight);

    // Clear corner trap state once block is rewound or moved out of the corner
    if (mentor.state === "corner_trap" && !isCornerTrapped) {
      mentor.state = "idle_observing";
      mentor.userDismissed = false;
      mentor.currentDialog = {
        speaker: "Light Orb",
        text: "I am floating right beside you, Zyra. Take your time to look around!",
        promptType: "neutral",
      };
    }

    // 2. Corner Entrapment Deadlock Detection
    if (isCornerTrapped) {
      mentor.state = "corner_trap";
      mentor.currentDialog = {
        speaker: "Light Orb",
        text: "Oops, that corner is tight! Would you like to rewind one step together?",
        promptType: "socratic_hint",
      };
      if (!mentor.userDismissed) {
        mentor.isBubbleOpen = true;
      }
      return mentor.currentDialog;
    }

    // If the child explicitly closed the bubble, suppress auto-opening during idle ticks
    // or existing corner traps until an actionable trigger occurs (e.g. pushing a block,
    // undoing, clearing the room, or directly tapping the Light Orb).
    if (mentor.userDismissed) {
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
    mentor.userDismissed = false;
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
    // Do NOT clear userDismissed if currently in corner_trap:
    // The child already dismissed the corner trap prompt while navigating.
    // Dismissal is cleared once the trap is resolved or if the child taps the Light Orb.
    if (mentor.state !== "corner_trap") {
      mentor.userDismissed = false;
    }
    if (mentor.state === "idle_nudge") {
      mentor.state = "idle_observing";
    }
  }

  /**
   * Records a failed push impulse (e.g. block obstructed by wall or boundary).
   */
  static recordFailedPush(mentor: MentorComponent): void {
    mentor.unproductivePushCount += 1;
    mentor.userDismissed = false;
  }

  /**
   * Records a successful push, clearing unproductive push count.
   */
  static recordSuccessfulPush(mentor: MentorComponent): void {
    mentor.unproductivePushCount = 0;
    mentor.idleSeconds = 0;
    mentor.userDismissed = false;
    if (mentor.state === "block_failed_push") {
      mentor.state = "idle_observing";
    }
  }

  /**
   * Toggles or sets the visibility of the companion's thought/speech bubble.
   * When dismissed by user, sets userDismissed to prevent auto-reopen.
   */
  static setBubbleOpen(mentor: MentorComponent, open: boolean): void {
    mentor.isBubbleOpen = open;
    if (!open) {
      mentor.idleSeconds = 0;
      mentor.userDismissed = true;
    } else {
      mentor.userDismissed = false;
    }
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
    mentor.userDismissed = false;
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

  /**
   * Handles pre-defined Socratic inquiry chip selection.
   * STRICT PEDAGOGICAL RULE: No spoiling imperative commands.
   */
  static handleInquiry(
    mentor: MentorComponent,
    chipId: string
  ): { dialog: SocraticDialog; triggersUndo: boolean } {
    mentor.userDismissed = false;
    const chip = SOCRATIC_INQUIRY_CHIPS.find((c) => c.id === chipId);
    if (!chip) {
      return { dialog: mentor.currentDialog, triggersUndo: false };
    }

    mentor.state = "direct_hint_request";
    mentor.currentDialog = {
      speaker: "Light Orb",
      text: chip.response,
      promptType: "socratic_hint",
    };
    mentor.isBubbleOpen = true;

    return {
      dialog: mentor.currentDialog,
      triggersUndo: chipId === "step_back",
    };
  }

  /**
   * Matches a spoken voice query from the child to an appropriate Socratic response.
   * Zero didactic imperatives: guides through physical causality, friction, and observation.
   */
  static matchVoiceQueryToSocraticResponse(
    mentor: MentorComponent,
    transcript: string
  ): { dialog: SocraticDialog; triggersUndo: boolean } {
    mentor.userDismissed = false;
    const lower = transcript.toLowerCase().trim();

    // 1. Inquiries about stepping back, rewind, stuck in corner, or undo
    if (
      lower.includes("step back") ||
      lower.includes("undo") ||
      lower.includes("rewind") ||
      lower.includes("go back") ||
      lower.includes("back") ||
      lower.includes("stuck") ||
      lower.includes("corner") ||
      lower.includes("tight") ||
      lower.includes("trapped") ||
      lower.includes("wrong")
    ) {
      return MentorSystem.handleInquiry(mentor, "step_back");
    }

    // 2. Inquiries about movement, sliding, friction, ice, stone stopping
    if (
      lower.includes("why") ||
      lower.includes("stop") ||
      lower.includes("slide") ||
      lower.includes("stone") ||
      lower.includes("rock") ||
      lower.includes("ice") ||
      lower.includes("heavy") ||
      lower.includes("friction") ||
      lower.includes("slippery")
    ) {
      return MentorSystem.handleInquiry(mentor, "why_stop");
    }

    // 3. Inquiries about what to look for, switches, plates, doors, clues
    if (
      lower.includes("look") ||
      lower.includes("what") ||
      lower.includes("where") ||
      lower.includes("plate") ||
      lower.includes("switch") ||
      lower.includes("button") ||
      lower.includes("floor") ||
      lower.includes("door") ||
      lower.includes("help") ||
      lower.includes("clue") ||
      lower.includes("how")
    ) {
      return MentorSystem.handleInquiry(mentor, "look_for");
    }

    // 4. Default gentle contextual encouragement
    mentor.state = "direct_hint_request";
    mentor.currentDialog = {
      speaker: "Light Orb",
      text: "I hear you! Look around the room together with me. Do you notice anything that can be moved?",
      promptType: "socratic_hint",
    };
    mentor.isBubbleOpen = true;
    return {
      dialog: mentor.currentDialog,
      triggersUndo: false,
    };
  }

  /**
   * Checks whether a specific pushable block is trapped in a corner formed by
   * impassable room boundaries or solid obstacles without resting on a pressure plate.
   */
  static isBlockCornerTrapped(
    block: Entity,
    entities: Entity[],
    roomWidth: number = 16,
    roomHeight: number = 9
  ): boolean {
    if (!block.pushable) {
      return false;
    }

    // A block resting on a pressure plate is active or solving, not deadlocked
    const isOnPlate = entities.some(
      (e) =>
        e.trigger !== undefined &&
        e.position.x === block.position.x &&
        e.position.y === block.position.y
    );
    if (isOnPlate) {
      return false;
    }

    const isObstacle = (x: number, y: number): boolean => {
      // Room perimeter edges are solid boundaries
      if (x < 0 || x >= roomWidth || y < 0 || y >= roomHeight) {
        return true;
      }
      // Non-pushable solid colliders (walls, sealed doors) are impassable obstacles
      return entities.some(
        (e) =>
          e.id !== block.id &&
          e.position.x === x &&
          e.position.y === y &&
          e.collider?.isSolid &&
          !e.pushable
      );
    };

    const blockedNorth = isObstacle(block.position.x, block.position.y - 1);
    const blockedSouth = isObstacle(block.position.x, block.position.y + 1);
    const blockedWest = isObstacle(block.position.x - 1, block.position.y);
    const blockedEast = isObstacle(block.position.x + 1, block.position.y);

    return (
      (blockedNorth && blockedWest) ||
      (blockedNorth && blockedEast) ||
      (blockedSouth && blockedWest) ||
      (blockedSouth && blockedEast)
    );
  }

  /**
   * Checks whether any pushable block in the room is trapped in a corner deadlock.
   */
  static isAnyBlockCornerTrapped(
    entities: Entity[],
    roomWidth: number = 16,
    roomHeight: number = 9
  ): boolean {
    const pushables = entities.filter((e) => e.pushable !== undefined);
    return pushables.some((block) =>
      MentorSystem.isBlockCornerTrapped(block, entities, roomWidth, roomHeight)
    );
  }
}
