"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { GameWorld } from "../ecs/world";
import { ALL_SHRINE_ROOMS } from "../game/rooms";
import { HudOverlay } from "../components/ui/HudOverlay";
import { LightOrbCompanion } from "../components/mentor/LightOrbCompanion";
import { EmpathyModal } from "../components/npc/EmpathyModal";
import { Entity } from "../ecs/entities";
import { TouchFeedback } from "../components/ui/TouchFeedback";
import { useWebLLM } from "../hooks/useWebLLM";
import { GridPoint, TouchFeedbackEvent, RoomDefinition, SocraticDialog } from "../types/game";
import { TwilightOverlay } from "../components/bedtime/TwilightOverlay";
import { useBedtime } from "../lib/bedtime/useBedtime";
import { BEDTIME_PROMPT } from "../lib/bedtime/bedtimeManager";

// Next.js dynamic import with ssr: false for client-only Phaser 3 canvas initialization
const DynamicPhaserContainer = dynamic(
  () => import("../components/game/PhaserContainer").then((mod) => mod.PhaserContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-storybook-bg text-storybook-subtle select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading Phaser Engine...</span>
        </div>
      </div>
    ),
  }
);

export default function GamePage() {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const currentRoom = ALL_SHRINE_ROOMS[currentRoomIndex];

  const worldRef = useRef<GameWorld>(new GameWorld(currentRoom));
  const [touchEvents, setTouchEvents] = useState<TouchFeedbackEvent[]>([]);
  const [inactiveSeconds, setInactiveSeconds] = useState(0);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mentorDialog, setMentorDialog] = useState<SocraticDialog>(
    worldRef.current.getMentorDialog()
  );
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [activeNpcModal, setActiveNpcModal] = useState<Entity | null>(null);

  const { generateHint: generateWebLLMHint, status: webLLMStatus } = useWebLLM({
    autoInit: true,
  });

  const { state: bedtimeState, extendSession, resetSession } = useBedtime({
    onPhaseChange: (newPhase) => {
      if (newPhase === "twilight" || newPhase === "bedtime") {
        setMentorDialog({
          speaker: "Light Orb",
          text: BEDTIME_PROMPT,
          promptType: "encourage",
        });
        setIsMentorOpen(true);
      }
    },
  });

  const stopPlayerMovement = useCallback(() => {
    if (moveTimerRef.current) {
      clearInterval(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    worldRef.current.cancelPlayerMovement();
  }, []);

  // Synchronize world entities on room load
  const loadRoom = useCallback((room: RoomDefinition) => {
    stopPlayerMovement();
    const world = new GameWorld(room);
    // Deep clone entities so resets work cleanly and deterministically
    world.setEntities(JSON.parse(JSON.stringify(room.entities)));
    worldRef.current = world;
    setInactiveSeconds(0);
    setMentorDialog(world.getMentorDialog());
    setIsMentorOpen(world.isMentorBubbleOpen());
    setCanUndo(false);
    setActiveNpcModal(null);
  }, [stopPlayerMovement]);

  const handleUndo = useCallback(() => {
    stopPlayerMovement();
    const world = worldRef.current;
    const undone = world.undoLastMove();
    if (undone) {
      setMentorDialog(world.getMentorDialog());
      setIsMentorOpen(world.isMentorBubbleOpen());
      setCanUndo(world.canUndo());
    }
  }, [stopPlayerMovement]);

  const handleNpcTap = useCallback((npc: Entity) => {
    stopPlayerMovement();
    setActiveNpcModal(npc);
  }, [stopPlayerMovement]);

  const handleMirrorTap = useCallback((_mirror: Entity) => {
    stopPlayerMovement();
    setCanUndo(worldRef.current.canUndo());
  }, [stopPlayerMovement]);

  const handleCompleteBreathing = useCallback(() => {
    if (!activeNpcModal) return;
    const world = worldRef.current;
    const result = world.sootheNpcWithBreathing(activeNpcModal.id);
    if (result.success) {
      world.evaluateTriggers();
      setCanUndo(world.canUndo());
      const updatedNpc = world.getNpc(activeNpcModal.id);
      if (updatedNpc) {
        setActiveNpcModal({ ...updatedNpc });
      }
    }
  }, [activeNpcModal]);

  const handleOfferGift = useCallback((gift: string) => {
    if (!activeNpcModal) return;
    const world = worldRef.current;
    const result = world.sootheNpcWithGift(activeNpcModal.id, gift);
    if (result.success) {
      world.evaluateTriggers();
      setCanUndo(world.canUndo());
      const updatedNpc = world.getNpc(activeNpcModal.id);
      if (updatedNpc) {
        setActiveNpcModal({ ...updatedNpc });
      }
    }
  }, [activeNpcModal]);

  const handleSelectInquiryChip = useCallback(async (chipId: string) => {
    stopPlayerMovement();
    const world = worldRef.current;
    const result = world.answerInquiryChip(chipId);
    setMentorDialog(result.dialog);
    setIsMentorOpen(true);
    setCanUndo(world.canUndo());

    if (webLLMStatus === "ready") {
      try {
        const roomState = world.serializeForMentor();
        const llmHint = await generateWebLLMHint(
          {
            entities: world.getEntityList(),
            roomId: currentRoom.id,
            roomName: currentRoom.name,
            objective: currentRoom.objective,
            roomState: roomState.rawText,
          },
          `Inquiry: ${chipId}`
        );
        if (llmHint) {
          setMentorDialog((prev) => ({
            ...prev,
            speaker: "Light Orb",
            text: llmHint,
            promptType: "socratic_hint",
          }));
        }
      } catch {
        // Transparently retain deterministic result
      }
    }
  }, [currentRoom, generateWebLLMHint, stopPlayerMovement, webLLMStatus]);

  const handleVoiceQuery = useCallback(async (transcript: string) => {
    stopPlayerMovement();
    const world = worldRef.current;
    const result = world.answerVoiceQuery(transcript);
    setMentorDialog(result.dialog);
    setIsMentorOpen(true);
    setCanUndo(world.canUndo());

    if (webLLMStatus === "ready") {
      try {
        const roomState = world.serializeForMentor();
        const llmHint = await generateWebLLMHint(
          {
            entities: world.getEntityList(),
            roomId: currentRoom.id,
            roomName: currentRoom.name,
            objective: currentRoom.objective,
            roomState: roomState.rawText,
          },
          transcript
        );
        if (llmHint) {
          setMentorDialog((prev) => ({
            ...prev,
            speaker: "Light Orb",
            text: llmHint,
            promptType: "socratic_hint",
          }));
        }
      } catch {
        // Transparently retain deterministic result on error
      }
    }
  }, [currentRoom, generateWebLLMHint, stopPlayerMovement, webLLMStatus]);

  useEffect(() => {
    loadRoom(currentRoom);
    return () => {
      if (moveTimerRef.current) {
        clearInterval(moveTimerRef.current);
      }
    };
  }, [currentRoom, loadRoom]);

  // Inactivity tracking and mentor state machine tick
  useEffect(() => {
    const interval = setInterval(() => {
      setInactiveSeconds((prev) => {
        const nextSec = prev + 1;
        const dialog = worldRef.current.tickMentor(1);
        setMentorDialog(dialog);
        setIsMentorOpen(worldRef.current.isMentorBubbleOpen());
        return nextSec;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clean old touch ripples
  useEffect(() => {
    if (touchEvents.length === 0) return;
    const timer = setTimeout(() => {
      setTouchEvents((prev) => prev.slice(1));
    }, 600);
    return () => clearTimeout(timer);
  }, [touchEvents]);

  const handleRoomCompleted = useCallback(() => {
    stopPlayerMovement();
    worldRef.current.tickMentor(0);
    setMentorDialog(worldRef.current.getMentorDialog());
    setIsMentorOpen(worldRef.current.isMentorBubbleOpen());

    setTimeout(() => {
      if (currentRoomIndex < ALL_SHRINE_ROOMS.length - 1) {
        setCurrentRoomIndex((prev) => prev + 1);
      } else {
        alert("Congratulations Zyra! You have cleared all initial trial shrines!");
        setCurrentRoomIndex(0);
      }
    }, 350);
  }, [currentRoomIndex, stopPlayerMovement]);

  const handleCellTap = (point: GridPoint, screenX: number, screenY: number) => {
    setInactiveSeconds(0);

    const world = worldRef.current;
    world.recordMentorPlayerMove();
    setMentorDialog(world.getMentorDialog());
    if (world.isMentorBubbleOpen() && !world.mentor.userDismissed) {
      setIsMentorOpen(true);
    } else if (!world.isMentorBubbleOpen()) {
      setIsMentorOpen(false);
    }

    // Visual feedback event (<16.7ms)
    setTouchEvents((prev) => [
      ...prev,
      {
        id: `touch-${Date.now()}-${Math.random()}`,
        x: point.x,
        y: point.y,
        screenX,
        screenY,
        timestamp: Date.now(),
      },
    ]);

    const player = world.getPlayer();
    if (!player) return;

    // Check if target is adjacent and is a pushable block
    const isAdjacent =
      Math.abs(point.x - player.position.x) + Math.abs(point.y - player.position.y) === 1;

    const targetNpc = world
      .getEntityList()
      .find((e) => e.npc && e.position.x === point.x && e.position.y === point.y);
    if (targetNpc) {
      stopPlayerMovement();
      setActiveNpcModal(targetNpc);
      return;
    }

    const targetMirror = world
      .getEntityList()
      .find((e) => e.optics?.opticsType === "mirror" && e.position.x === point.x && e.position.y === point.y);
    if (targetMirror) {
      stopPlayerMovement();
      world.rotateMirror(targetMirror.id);
      setCanUndo(world.canUndo());
      return;
    }

    const targetBlock = world
      .getEntityList()
      .find((e) => e.position.x === point.x && e.position.y === point.y && e.pushable);

    if (isAdjacent && targetBlock) {
      stopPlayerMovement();

      // Execute push in pure ECS
      const pushDirection: GridPoint = {
        x: point.x - player.position.x,
        y: point.y - player.position.y,
      };
      const pushResult = world.pushBlock(targetBlock.id, pushDirection);
      if (pushResult.success && pushResult.newPath.length > 0) {
        world.recordMentorSuccessfulPush();
        world.evaluateTriggers();
        setMentorDialog(world.getMentorDialog());
        setIsMentorOpen(world.isMentorBubbleOpen());
        setCanUndo(world.canUndo());

        if (targetBlock.pushable?.isSliding) {
          const slideDistance = pushResult.newPath.length;
          const slideDurationMs = Math.max(350, slideDistance * 80);
          setTimeout(() => {
            if (targetBlock.pushable) {
              targetBlock.pushable.isSliding = false;
            }
            world.evaluateTriggers();
          }, slideDurationMs);
        }
        return;
      } else {
        // Blocked push attempt against wall or obstacle
        world.recordMentorFailedPush();
        setMentorDialog(world.getMentorDialog());
        setIsMentorOpen(world.isMentorBubbleOpen());
        return;
      }
    }

    // Otherwise, plan unimanual A* tap-to-move pathfinding avoiding obstacles
    stopPlayerMovement();

    const path = world.planMove(point);
    if (path.length <= 1) {
      return;
    }

    world.startPlayerMovement(path);
    setCanUndo(world.canUndo());

    const stepInterval = player.movement?.stepIntervalMs || 150;

    const advanceStep = () => {
      const stepResult = world.stepPlayerMovement();
      world.evaluateTriggers();

      // Check if player reached the open exit door
      const door = world.getEntityList().find((e) => e.renderable.shape === "door");
      const isDoorOpen = door?.collider && !door.collider.isSolid;
      if (
        door &&
        isDoorOpen &&
        stepResult.currentPos.x === door.position.x &&
        stepResult.currentPos.y === door.position.y
      ) {
        handleRoomCompleted();
        return;
      }

      if (stepResult.finished) {
        if (moveTimerRef.current) {
          clearInterval(moveTimerRef.current);
          moveTimerRef.current = null;
        }

        // If player walked toward a pushable block, trigger push upon arrival if adjacent
        const p = world.getPlayer();
        if (p && targetBlock && targetBlock.position.x === point.x && targetBlock.position.y === point.y) {
          const isNowAdjacent =
            Math.abs(point.x - p.position.x) + Math.abs(point.y - p.position.y) === 1;
          if (isNowAdjacent) {
            const pushDirection: GridPoint = {
              x: point.x - p.position.x,
              y: point.y - p.position.y,
            };
            const pushResult = world.pushBlock(targetBlock.id, pushDirection);
            if (pushResult.success && pushResult.newPath.length > 0) {
              world.recordMentorSuccessfulPush();
              world.evaluateTriggers();
              setMentorDialog(world.getMentorDialog());
              setIsMentorOpen(world.isMentorBubbleOpen());
              setCanUndo(world.canUndo());

              if (targetBlock.pushable?.isSliding) {
                const slideDistance = pushResult.newPath.length;
                const slideDurationMs = Math.max(350, slideDistance * 80);
                setTimeout(() => {
                  if (targetBlock.pushable) {
                    targetBlock.pushable.isSliding = false;
                  }
                  world.evaluateTriggers();
                }, slideDurationMs);
              }
            } else {
              world.recordMentorFailedPush();
              setMentorDialog(world.getMentorDialog());
              setIsMentorOpen(world.isMentorBubbleOpen());
            }
          }
        }
      }
    };

    // Execute first step immediately for zero latency feedback
    advanceStep();

    // If more waypoints remain, step along path with interval
    const updatedPlayer = world.getPlayer();
    if (updatedPlayer?.movement?.isMoving) {
      moveTimerRef.current = setInterval(advanceStep, stepInterval);
    }
  };

  const handleResetRoom = () => {
    stopPlayerMovement();
    loadRoom(currentRoom);
  };

  const handleOrbTap = async () => {
    const world = worldRef.current;
    if (isMentorOpen) {
      world.setMentorBubbleOpen(false);
      setIsMentorOpen(false);
    } else {
      const hint = world.requestMentorDirectHint();
      setMentorDialog(hint);
      setIsMentorOpen(true);

      if (webLLMStatus === "ready") {
        try {
          const roomState = world.serializeForMentor();
          const llmHint = await generateWebLLMHint({
            entities: world.getEntityList(),
            roomId: currentRoom.id,
            roomName: currentRoom.name,
            objective: currentRoom.objective,
            roomState: roomState.rawText,
          });
          if (llmHint) {
            setMentorDialog((prev) => ({
              ...prev,
              speaker: "Light Orb",
              text: llmHint,
              promptType: "socratic_hint",
            }));
          }
        } catch {
          // Transparently retain deterministic hint on error
        }
      }
    }
  };

  const handleCloseMentorBubble = () => {
    worldRef.current.setMentorBubbleOpen(false);
    setIsMentorOpen(false);
  };

  return (
    <main className="relative flex h-screen w-screen h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-storybook-bg select-none touch-none overscroll-none">
      {/* 16:9 Landscape Phaser 3 Canvas Viewport (1280x720 FIT centered) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <DynamicPhaserContainer
          world={worldRef.current}
          room={currentRoom}
          onCellTap={handleCellTap}
          onRoomCompleted={handleRoomCompleted}
          onNpcTap={handleNpcTap}
          onMirrorTap={handleMirrorTap}
        />
      </div>

      {/* Floating React UI Overlay with Touch Pass-Through (pointer-events-none container) */}
      <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">
        {/* Top Floating Bar: HUD (Room Title, Objective, Reset, Undo) and Light Orb Mentor */}
        <div className="flex items-start justify-between w-full">
          <HudOverlay
            roomName={currentRoom.name}
            objective={currentRoom.objective}
            onResetRoom={handleResetRoom}
            onUndo={handleUndo}
            canUndo={canUndo}
          />

          <LightOrbCompanion
            dialog={mentorDialog}
            inactiveSeconds={inactiveSeconds}
            isOpen={isMentorOpen}
            onOrbTap={handleOrbTap}
            onCloseBubble={handleCloseMentorBubble}
            onSelectChip={handleSelectInquiryChip}
            onVoiceQuery={handleVoiceQuery}
            onUndo={handleUndo}
            canUndo={canUndo}
          />
        </div>
      </div>

      {/* NPC Empathy & Emotion Regulation Modal */}
      <EmpathyModal
        isOpen={activeNpcModal !== null}
        npc={activeNpcModal}
        onClose={() => setActiveNpcModal(null)}
        onCompleteBreathing={handleCompleteBreathing}
        onOfferGift={handleOfferGift}
      />

      {/* Bedtime Twilight Transition & Gentle Off-ramp */}
      <TwilightOverlay
        phase={bedtimeState.phase}
        remainingSeconds={bedtimeState.remainingSeconds}
        onExtend={() => extendSession(300)}
        onClose={() => resetSession()}
      />

      {/* Visual Touch Ripple Layer (zero-blocking touch pass-through) */}
      <TouchFeedback events={touchEvents} />
    </main>
  );
}
