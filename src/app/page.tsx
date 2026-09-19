"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GameWorld } from "../ecs/world";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createIceBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  Entity,
} from "../ecs/entities";
import { RoomGrid } from "../components/ui/RoomGrid";
import { TouchFeedback } from "../components/ui/TouchFeedback";
import { HudOverlay } from "../components/ui/HudOverlay";
import { LightOrbCompanion } from "../components/mentor/LightOrbCompanion";
import { SocraticEngine } from "../lib/socraticEngine";
import { GridPoint, TouchFeedbackEvent, RoomDefinition } from "../types/game";

// 3 Micro-Dungeon Shrines conforming to the Path 3 Prototype Spec
const SHRINE_ROOMS: RoomDefinition[] = [
  {
    id: "shrine-01",
    name: "Shrine of Still Weight",
    width: 12,
    height: 7,
    objective: "Push the heavy stone block onto the round pressure plate",
    hintKey: "stone_hint",
    entities: [
      createPlayerEntity("player-1", 2, 3),
      createStoneBlockEntity("stone-1", 5, 3),
      createPressurePlateEntity("plate-1", 8, 3, "door-1"),
      createDoorEntity("door-1", 11, 3),
    ],
  },
  {
    id: "shrine-02",
    name: "Shrine of Glacial Flow",
    width: 12,
    height: 7,
    objective: "Slide the frictionless ice block across the room",
    hintKey: "ice_hint",
    entities: [
      createPlayerEntity("player-1", 2, 2),
      createIceBlockEntity("ice-1", 4, 2),
      createPressurePlateEntity("plate-2", 10, 2, "door-2"),
      createDoorEntity("door-2", 11, 2),
    ],
  },
  {
    id: "shrine-03",
    name: "Shrine of Harmony Gates",
    width: 12,
    height: 7,
    objective: "Position both blocks to complete the dual-switch circuit",
    hintKey: "dual_hint",
    entities: [
      createPlayerEntity("player-1", 1, 3),
      createStoneBlockEntity("stone-2", 4, 2),
      createIceBlockEntity("ice-2", 4, 4),
      createPressurePlateEntity("plate-3a", 8, 2, "door-3"),
      createPressurePlateEntity("plate-3b", 8, 4, "door-3"),
      createDoorEntity("door-3", 11, 3),
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

  // Synchronize world entities on room load
  const loadRoom = useCallback((room: RoomDefinition) => {
    const world = new GameWorld(room);
    // Clone entities so resets work cleanly
    world.setEntities(JSON.parse(JSON.stringify(room.entities)));
    worldRef.current = world;
    setEntities(world.getEntityList());
    setInactiveSeconds(0);
  }, []);

  useEffect(() => {
    loadRoom(currentRoom);
  }, [currentRoom, loadRoom]);

  // Adjust cell size dynamically based on window dimensions, keeping >= 64px-88px
  useEffect(() => {
    const updateSize = () => {
      const availWidth = window.innerWidth - 64;
      const availHeight = window.innerHeight - 120;
      const calculatedW = Math.floor(availWidth / currentRoom.width);
      const calculatedH = Math.floor(availHeight / currentRoom.height);
      const optimal = Math.max(64, Math.min(96, Math.min(calculatedW, calculatedH)));
      setCellSize(optimal);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [currentRoom.width, currentRoom.height]);

  // Inactivity tracking timer
  useEffect(() => {
    const interval = setInterval(() => {
      setInactiveSeconds((prev) => prev + 1);
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

    const world = worldRef.current;
    const player = world.getPlayer();
    if (!player) return;

    // Check if target is adjacent and is a pushable block
    const isAdjacent =
      Math.abs(point.x - player.position.x) + Math.abs(point.y - player.position.y) === 1;

    const targetBlock = world
      .getEntityList()
      .find((e) => e.position.x === point.x && e.position.y === point.y && e.pushable);

    if (isAdjacent && targetBlock) {
      // Execute push
      const pushDirection: GridPoint = {
        x: point.x - player.position.x,
        y: point.y - player.position.y,
      };
      const pushResult = world.pushBlock(targetBlock.id, pushDirection);
      if (pushResult.success && pushResult.newPath.length > 0) {
        const finalPos = pushResult.newPath[pushResult.newPath.length - 1];
        targetBlock.position.x = finalPos.x;
        targetBlock.position.y = finalPos.y;

        // Player moves into the block's old spot
        player.position.x = point.x;
        player.position.y = point.y;

        // Evaluate triggers
        world.evaluateTriggers();
        setEntities([...world.getEntityList()]);
        return;
      }
    }

    // Otherwise, plan unimanual A* pathfinding
    const path = world.planMove(point);
    if (path.length > 1) {
      // Step player to destination
      const destination = path[path.length - 1];

      // Check if destination is the open door
      const door = world.getEntityList().find((e) => e.renderable.shape === "door");
      const isDoorOpen = door?.collider && !door.collider.isSolid;

      player.position.x = destination.x;
      player.position.y = destination.y;

      if (door && isDoorOpen && destination.x === door.position.x && destination.y === door.position.y) {
        // Advance to next shrine room
        setTimeout(() => {
          if (currentRoomIndex < SHRINE_ROOMS.length - 1) {
            setCurrentRoomIndex((prev) => prev + 1);
          } else {
            alert("Congratulations Zyra! You have cleared all initial trial shrines!");
            setCurrentRoomIndex(0);
          }
        }, 300);
      }

      world.evaluateTriggers();
      setEntities([...world.getEntityList()]);
    }
  };

  const handleResetRoom = () => {
    loadRoom(currentRoom);
  };

  const currentDialog = SocraticEngine.evaluateState(entities, inactiveSeconds);

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center p-4 bg-storybook-bg overflow-hidden select-none">
      {/* HUD Bar */}
      <HudOverlay
        roomName={currentRoom.name}
        objective={currentRoom.objective}
        onResetRoom={handleResetRoom}
      />

      {/* Socratic Mentor Companion */}
      <LightOrbCompanion
        dialog={currentDialog}
        inactiveSeconds={inactiveSeconds}
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
