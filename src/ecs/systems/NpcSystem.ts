import { Entity } from "../entities";
import { NpcEmotionState } from "../components";

export interface SootheResult {
  success: boolean;
  soothed: boolean;
  unsealedDoorId?: string;
}

export class NpcSystem {
  /**
   * Distance calculation to check if Zyra is within soothing interaction proximity
   * (adjacent tile or within maxDistance).
   */
  static isPlayerNearNpc(player: Entity, npc: Entity, maxDistance: number = 1.5): boolean {
    const dx = player.position.x - npc.position.x;
    const dy = player.position.y - npc.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= maxDistance;
  }

  /**
   * Guides a co-breathing cycle with a distressed NPC.
   * Completing the required breath cycles soothes the NPC into a calm state
   * and unseals connected gate barriers.
   */
  static sootheWithBreathing(
    npc: Entity,
    allEntities: Entity[],
    cycles: number = 1
  ): SootheResult {
    if (!npc.npc) {
      return { success: false, soothed: false };
    }

    npc.npc.currentBreathCount = (npc.npc.currentBreathCount || 0) + cycles;
    const required = npc.npc.breathCountRequired || 1;

    if (npc.npc.currentBreathCount >= required) {
      npc.npc.isSoothed = true;
      npc.npc.emotion = "calm";
      npc.npc.auraColor = "#FDE047"; // Peaceful sunny golden glow

      let unsealedDoorId: string | undefined;
      if (npc.npc.unblocksTargetId) {
        this.unsealTarget(allEntities, npc.npc.unblocksTargetId);
        unsealedDoorId = npc.npc.unblocksTargetId;
      }

      return { success: true, soothed: true, unsealedDoorId };
    }

    return { success: true, soothed: false };
  }

  /**
   * Offers a comforting gift (e.g., lavender wildflower) to immediately soothe the NPC.
   */
  static sootheWithGift(
    npc: Entity,
    allEntities: Entity[],
    _giftItem: string
  ): SootheResult {
    if (!npc.npc) {
      return { success: false, soothed: false };
    }

    npc.npc.isSoothed = true;
    npc.npc.emotion = "joyful";
    npc.npc.auraColor = "#FDE047"; // Radiant joyful golden glow

    let unsealedDoorId: string | undefined;
    if (npc.npc.unblocksTargetId) {
      this.unsealTarget(allEntities, npc.npc.unblocksTargetId);
      unsealedDoorId = npc.npc.unblocksTargetId;
    }

    return { success: true, soothed: true, unsealedDoorId };
  }

  /**
   * Unseals the designated target door or barrier collider when an NPC is calmed.
   */
  static unsealTarget(allEntities: Entity[], targetId: string): boolean {
    const target = allEntities.find((e) => e.id === targetId);
    if (target && target.collider) {
      target.collider.isSolid = false;
      return true;
    }
    return false;
  }

  /**
   * Returns visual hex aura color for an emotion state.
   */
  static getEmotionAuraColor(emotion: NpcEmotionState, isSoothed: boolean): string {
    if (isSoothed) {
      return "#FDE047"; // Sunny golden calm/joy
    }
    switch (emotion) {
      case "anxious":
        return "#F59E0B"; // Amber tremor
      case "sad":
        return "#818CF8"; // Soft indigo
      case "calm":
        return "#38BDF8"; // Serene sky cyan
      case "joyful":
        return "#FDE047"; // Golden warm
      default:
        return "#F59E0B";
    }
  }
}
