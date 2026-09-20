import { Entity } from "../entities";
import { LogicGateComponent, LogicGateType } from "../components";

export interface LogicEvaluationResult {
  satisfiedGateIds: string[];
  doorsUnlocked: string[];
  currentSequences: Record<string, string[]>;
}

export class LogicSystem {
  /**
   * Evaluates all logic gates (AND, OR, Sequential) in the world.
   * Updates gate satisfaction, advances/resets sequences, and unseals target doors.
   */
  public static evaluate(allEntities: Entity[]): LogicEvaluationResult {
    const gates = allEntities.filter((e) => e.logicGate !== undefined);
    const doors = allEntities.filter((e) => e.renderable.shape === "door");

    const satisfiedGateIds: string[] = [];
    const doorsUnlocked: string[] = [];
    const currentSequences: Record<string, string[]> = {};

    // Helper to check if an input entity is active (depressed trigger, lit receptor, etc.)
    const isEntityActive = (entityId: string): boolean => {
      const entity = allEntities.find((e) => e.id === entityId);
      if (!entity) return false;
      if (entity.trigger) return entity.trigger.isDepressed;
      if (entity.optics) return entity.optics.isActivated ?? false;
      if (entity.logicGate) return entity.logicGate.isSatisfied;
      return false;
    };

    // Helper to find which input switch is currently occupied by player or a pushable block
    const getOccupiedInputId = (inputIds: string[]): string | undefined => {
      for (const inputId of inputIds) {
        const inputEntity = allEntities.find((e) => e.id === inputId);
        if (!inputEntity) continue;

        const isOccupied = allEntities.some(
          (other) =>
            other.id !== inputEntity.id &&
            (other.renderable.shape === "avatar" || other.pushable !== undefined) &&
            other.position.x === inputEntity.position.x &&
            other.position.y === inputEntity.position.y
        );

        if (isOccupied) {
          return inputId;
        }
      }
      return undefined;
    };

    for (const gateEntity of gates) {
      const gate = gateEntity.logicGate!;
      currentSequences[gateEntity.id] = [...gate.currentSequence];

      switch (gate.gateType) {
        case "and": {
          const allActive =
            gate.inputEntityIds.length > 0 &&
            gate.inputEntityIds.every((id) => isEntityActive(id));
          gate.isSatisfied = allActive;
          break;
        }

        case "or": {
          const anyActive =
            gate.inputEntityIds.length > 0 &&
            gate.inputEntityIds.some((id) => isEntityActive(id));
          gate.isSatisfied = anyActive;
          break;
        }

        case "sequential": {
          if (gate.requiredSequence && gate.requiredSequence.length > 0) {
            const occupiedId = getOccupiedInputId(gate.inputEntityIds);

            if (occupiedId) {
              const lastStep =
                gate.currentSequence.length > 0
                  ? gate.currentSequence[gate.currentSequence.length - 1]
                  : null;

              // If player is still standing on the same switch, do nothing
              if (occupiedId !== lastStep) {
                if (!gate.isSatisfied) {
                  const expectedNext = gate.requiredSequence[gate.currentSequence.length];

                  if (occupiedId === expectedNext) {
                    // Correct sequential step
                    gate.currentSequence.push(occupiedId);
                    if (gate.currentSequence.length === gate.requiredSequence.length) {
                      gate.isSatisfied = true;
                    }
                  } else {
                    // Out-of-order step: gentle reset
                    if (occupiedId === gate.requiredSequence[0]) {
                      // Restart sequence at step 1 if stepping on first switch
                      gate.currentSequence = [occupiedId];
                    } else {
                      gate.currentSequence = [];
                    }
                    gate.isSatisfied = false;
                  }
                }
              }
            }
          }
          break;
        }
      }

      currentSequences[gateEntity.id] = [...gate.currentSequence];

      if (gate.isSatisfied) {
        satisfiedGateIds.push(gateEntity.id);
      }
    }

    // Evaluate target doors controlled by logic gates
    for (const gateEntity of gates) {
      const gate = gateEntity.logicGate!;
      const door = doors.find((d) => d.id === gate.targetDoorId);
      if (!door || !door.collider) continue;

      if (gate.isSatisfied) {
        door.collider.isSolid = false;
        door.renderable.colorToken = "storybook-magic-soft";
        if (!doorsUnlocked.includes(door.id)) {
          doorsUnlocked.push(door.id);
        }
      } else {
        // Only lock if no other satisfied gate or depressed plate is targeting this door
        const otherSatisfiedGate = gates.some(
          (g) =>
            g.id !== gateEntity.id &&
            g.logicGate?.targetDoorId === door.id &&
            g.logicGate.isSatisfied
        );
        const targetingPlates = allEntities.filter(
          (e) => e.trigger && e.trigger.activatesTargetId === door.id
        );
        const plateHoldingOpen =
          targetingPlates.length > 0 &&
          targetingPlates.every((p) => p.trigger?.isDepressed);

        if (!otherSatisfiedGate && !plateHoldingOpen) {
          door.collider.isSolid = true;
          door.renderable.colorToken = "storybook-muted";
        }
      }
    }

    return {
      satisfiedGateIds,
      doorsUnlocked,
      currentSequences,
    };
  }

  /**
   * Programmatically processes a sequential switch input for testing or direct trigger.
   */
  public static processSequentialStep(
    gate: LogicGateComponent,
    switchId: string
  ): boolean {
    if (!gate.requiredSequence || gate.requiredSequence.length === 0) return false;
    if (gate.isSatisfied) return true;

    const expectedNext = gate.requiredSequence[gate.currentSequence.length];
    if (switchId === expectedNext) {
      gate.currentSequence.push(switchId);
      if (gate.currentSequence.length === gate.requiredSequence.length) {
        gate.isSatisfied = true;
      }
      return true;
    } else {
      // Out of order: reset sequence
      if (switchId === gate.requiredSequence[0]) {
        gate.currentSequence = [switchId];
      } else {
        gate.currentSequence = [];
      }
      gate.isSatisfied = false;
      return false;
    }
  }
}
