"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GameWorld } from "../ecs/world";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createIceBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  createWallEntity,
  Entity,
} from "../ecs/entities";
import { RoomGrid } from "../components/ui/RoomGrid";
import { TouchFeedback } from "../components/ui/TouchFeedback";
import { HudOverlay } from "../components/ui/HudOverlay";
import { LightOrbCompanion } from "../components/mentor/LightOrbCompanion";
import { SocraticEngine } from "../lib/socraticEngine";
import { GridPoint, TouchFeedbackEvent, RoomDefinition, SocraticDialog } from "../types/game";
import { calculateGridCellSize } from "../lib/viewport";

// 3 Micro-Dungeon Shrines conforming to the 16:9 landscape prototype spec
const SHRINE_ROOMS: RoomDefinition[] = [
  {
    id: "shrine-01",
    name: "Shrine of Still Weight",
    width: 16,
    height: 9,
    objective: "Push the heavy stone block onto the round pressure plate",
    hintKey: "stone_hint",
    entities: [
      createPlayerEntity("player-1", 2, 4),
      createStoneBlockEntity("stone-1", 6, 4),
      createPressurePlateEntity("plate-1", 12, 4, "door-1"),
      createDoorEntity("door-1", 14, 4),
    ],
  },
  {
    id: "shrine-02",
    name: "Shrine of Glacial Flow",
    width: 16,
    height: 9,
    objective: "Slide the frictionless ice block across the room",
    hintKey: "ice_hint",
    entities: [
      createPlayerEntity("player-1", 2, 4),
      createIceBlockEntity("ice-1", 6, 4),
      createPressurePlateEntity("plate-2", 13, 4, "door-2"),
      createDoorEntity("door-2", 14, 4),
    ],
  },
  {
    id: "shrine-03",
    name: "Shrine of Harmony Gates",
    width: 16,
    height: 9,
    objective: "Position both blocks to complete the dual-switch circuit",
    hintKey: "dual_hint",
    entities: [
      createPlayerEntity("player-1", 1, 4),
      createStoneBlockEntity("stone-2", 5, 2),
      createIceBlockEntity("ice-2", 5, 6),
      createPressurePlateEntity("plate-3a", 12, 2, "door-3"),
      createPressurePlateEntity("plate-3b", 13, 6, "door-3"),
      createWallEntity("wall-3", 14, 6),
      createDoorEntity("door-3", 14, 4),
    ],
  },
];

export default function GamePage() {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const currentRoom = SHRINE_ROOMS[currentRoomIndex];

  const worldRef = useRef<GameWorld>(new GameWorld(currentRoom));
  const [entities, setEntities] = useState<Entity[]>([]);
  const [touchEvents, setTouchEvents] = useState<TouchFeedbackEvent[]>([]);
  const [inactiveSeconds, setInactiveSeconds] = useState(0);
  const [cellSize, setCellSize] = useState(80); // Strict >= 80px touch target default
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mentorDialog, setMentorDialog] = useState<SocraticDialog>(
    worldRef.current.getMentorDialog()
  );
  const [isMentorOpen, setIsMentorOpen] = useState(false);

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
    // Clone entities so resets work cleanly
    world.setEntities(JSON.parse(JSON.stringify(room.entities)));
    worldRef.current = world;
    setEntities(world.getEntityList());
    setInactiveSeconds(0);
    setMentorDialog(world.getMentorDialog());
    setIsMentorOpen(world.isMentorBubbleOpen());
  }, [stopPlayerMovement]);

  useEffect(() => {
    loadRoom(currentRoom);
    return () => {
      if (moveTimerRef.current) {
        clearInterval(moveTimerRef.current);
      }
    };
  }, [currentRoom, loadRoom]);

  // Scale the 16:9 room to fit the landscape viewport while preserving square cells.
  useEffect(() => {
    const updateSize = () => {
      setCellSize(
        calculateGridCellSize(currentRoom.width, currentRoom.height, window.innerWidth, window.innerHeight, {
          minCellSize: 64,
          maxCellSize: 96,
          paddingX: 96,
          paddingY: 180,
        })
      );
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [currentRoom.width, currentRoom.height]);

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

  const handleCellTap = (point: GridPoint, screenX: number, screenY: number) => {
    setInactiveSeconds(0);

    const world = worldRef.current;
    world.recordMentorPlayerMove();
    setMentorDialog(world.getMentorDialog());
    setIsMentorOpen(world.isMentorBubbleOpen());

    // 1. Immediate visual feedback event (<16.7ms)
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

    const targetBlock = world
      .getEntityList()
      .find((e) => e.position.x === point.x && e.position.y === point.y && e.pushable);

    if (isAdjacent && targetBlock) {
      stopPlayerMovement();

      // Execute push
      const pushDirection: GridPoint = {
        x: point.x - player.position.x,
        y: point.y - player.position.y,
      };
      const pushResult = world.pushBlock(targetBlock.id, pushDirection);
      if (pushResult.success && pushResult.newPath.length > 0) {
        world.recordMentorSuccessfulPush();
        world.evaluateTriggers();
        setEntities([...world.getEntityList()]);
        setMentorDialog(world.getMentorDialog());
        setIsMentorOpen(world.isMentorBubbleOpen());

        if (targetBlock.pushable?.isSliding) {
          const slideDistance = pushResult.newPath.length;
          const slideDurationMs = Math.max(350, slideDistance * 80);
          setTimeout(() => {
            if (targetBlock.pushable) {
              targetBlock.pushable.isSliding = false;
            }
            world.evaluateTriggers();
            setEntities([...world.getEntityList()]);
          }, slideDurationMs);
        }
        return;
      } else {
        // Blocked push attempt against wall or obstacle
        world.recordMentorFailedPush();
        setMentorDialog(world.getMentorDialog());
        setIsMentorOpen(world.isMentorBubbleOpen());
      }
    }

    // Otherwise, plan unimanual A* tap-to-move pathfinding avoiding obstacles
    // (or routing to the closest adjacent open tile if target is solid)
    stopPlayerMovement();

    const path = world.planMove(point);
    if (path.length <= 1) {
      return;
    }

    world.startPlayerMovement(path);

    const stepInterval = player.movement?.stepIntervalMs || 150;

    const advanceStep = () => {
      const stepResult = world.stepPlayerMovement();
      setEntities([...world.getEntityList()]);
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
        stopPlayerMovement();
        world.tickMentor(0);
        setMentorDialog(world.getMentorDialog());
        setIsMentorOpen(world.isMentorBubbleOpen());
        setTimeout(() => {
          if (currentRoomIndex < SHRINE_ROOMS.length - 1) {
            setCurrentRoomIndex((prev) => prev + 1);
          } else {
            alert("Congratulations Zyra! You have cleared all initial trial shrines!");
            setCurrentRoomIndex(0);
          }
        }, 300);
        return;
      }

      if (stepResult.finished) {
        if (moveTimerRef.current) {
          clearInterval(moveTimerRef.current);
          moveTimerRef.current = null;
        }

        // If player walked into a pushable block, trigger push upon arrival
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
              setEntities([...world.getEntityList()]);
              setMentorDialog(world.getMentorDialog());
              setIsMentorOpen(world.isMentorBubbleOpen());

              if (targetBlock.pushable?.isSliding) {
                const slideDistance = pushResult.newPath.length;
                const slideDurationMs = Math.max(350, slideDistance * 80);
                setTimeout(() => {
                  if (targetBlock.pushable) {
                    targetBlock.pushable.isSliding = false;
                  }
                  world.evaluateTriggers();
                  setEntities([...world.getEntityList()]);
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

  const handleOrbTap = () => {
    const world = worldRef.current;
    if (isMentorOpen) {
      world.setMentorBubbleOpen(false);
      setIsMentorOpen(false);
    } else {
      const hint = world.requestMentorDirectHint();
      setMentorDialog(hint);
      setIsMentorOpen(true);
    }
  };

  const handleCloseMentorBubble = () => {
    worldRef.current.setMentorBubbleOpen(false);
    setIsMentorOpen(false);
  };

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-storybook-bg p-4 select-none">
      {/* HUD Bar */}
      <HudOverlay
        roomName={currentRoom.name}
        objective={currentRoom.objective}
        onResetRoom={handleResetRoom}
      />

      {/* Socratic Mentor Companion */}
      <LightOrbCompanion
        dialog={mentorDialog}
        inactiveSeconds={inactiveSeconds}
        isOpen={isMentorOpen}
        onOrbTap={handleOrbTap}
        onCloseBubble={handleCloseMentorBubble}
      />

      {/* 16x9 Interactive CSS Grid Room */}
      <RoomGrid
        width={currentRoom.width}
        height={currentRoom.height}
        entities={entities}
        onCellTap={handleCellTap}
        cellSize={cellSize}
      />

      {/* Visual Touch Ripple Layer */}
      <TouchFeedback events={touchEvents} />
    </main>
  );
}
