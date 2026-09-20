"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { GameWorld } from "../../ecs/world";
import type { Entity } from "../../ecs/entities";
import type { GridPoint, RoomDefinition } from "../../types/game";
import type { ShrineScene } from "../../game/scenes/ShrineScene";
import type { BedtimePhase } from "../../lib/bedtime/bedtimeManager";

export interface PhaserContainerProps {
  world: GameWorld;
  room: RoomDefinition;
  onCellTap?: (point: GridPoint, screenX: number, screenY: number) => void;
  onRoomCompleted?: () => void;
  onNpcTap?: (npc: Entity) => void;
  onMirrorTap?: (mirror: Entity) => void;
  bedtimePhase?: BedtimePhase;
  className?: string;
}

export const PhaserContainer: React.FC<PhaserContainerProps> = ({
  world,
  room,
  onCellTap,
  onRoomCompleted,
  onNpcTap,
  onMirrorTap,
  bedtimePhase = "daylight",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ShrineScene | null>(null);

  // Keep latest callbacks in refs so Phaser event handlers invoke current React state
  const onCellTapRef = useRef(onCellTap);
  onCellTapRef.current = onCellTap;

  const onRoomCompletedRef = useRef(onRoomCompleted);
  onRoomCompletedRef.current = onRoomCompleted;

  const onNpcTapRef = useRef(onNpcTap);
  onNpcTapRef.current = onNpcTap;

  const onMirrorTapRef = useRef(onMirrorTap);
  onMirrorTapRef.current = onMirrorTap;

  const worldRef = useRef(world);
  worldRef.current = world;

  const roomRef = useRef(room);
  roomRef.current = room;

  const bedtimePhaseRef = useRef(bedtimePhase);
  bedtimePhaseRef.current = bedtimePhase;

  useEffect(() => {
    let isCancelled = false;
    let localGame: Phaser.Game | null = null;
    const container = containerRef.current;

    const initPhaser = async () => {
      if (typeof window === "undefined" || !container) return;

      const PhaserModule = await import("phaser");
      const Phaser = PhaserModule.default || PhaserModule;
      const { ShrineScene } = await import("../../game/scenes/ShrineScene");

      if (isCancelled || !container) return;

      // Clean up any stale canvas elements inside container before starting
      container.innerHTML = "";

      const sceneInstance = new ShrineScene();
      sceneRef.current = sceneInstance;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: container,
        width: 1280,
        height: 720,
        backgroundColor: "#F0F4F8",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1280,
          height: 720,
        },
        render: {
          pixelArt: false,
          antialias: true,
        },
        scene: [sceneInstance],
      };

      localGame = new Phaser.Game(config);
      gameRef.current = localGame;

      // When the scene is ready, pass initial world & callbacks
      localGame.events.once("ready", () => {
        if (isCancelled) return;
        const currentScene = localGame?.scene.getScene("ShrineScene") as ShrineScene | undefined;
        if (currentScene) {
          sceneRef.current = currentScene;
          currentScene.onCellTap = (point, screenX, screenY) => {
            onCellTapRef.current?.(point, screenX, screenY);
          };
          currentScene.onRoomCompleted = () => {
            onRoomCompletedRef.current?.();
          };
          currentScene.onNpcTap = (npc) => {
            onNpcTapRef.current?.(npc);
          };
          currentScene.onMirrorTap = (mirror) => {
            onMirrorTapRef.current?.(mirror);
          };
          currentScene.loadRoom(roomRef.current, worldRef.current);
          currentScene.setBedtimePhase(bedtimePhaseRef.current);
        }
      });
    };

    initPhaser();

    return () => {
      isCancelled = true;
      if (localGame) {
        localGame.destroy(true);
        localGame = null;
        gameRef.current = null;
        sceneRef.current = null;
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  // Update bedtime phase whenever bedtime state changes
  useEffect(() => {
    if (sceneRef.current && sceneRef.current.scene?.isActive()) {
      sceneRef.current.setBedtimePhase(bedtimePhase);
    }
  }, [bedtimePhase]);

  // Update running scene whenever room definition or world instance changes
  useEffect(() => {
    if (sceneRef.current && sceneRef.current.scene?.isActive()) {
      sceneRef.current.onCellTap = (point, screenX, screenY) => {
        onCellTapRef.current?.(point, screenX, screenY);
      };
      sceneRef.current.onRoomCompleted = () => {
        onRoomCompletedRef.current?.();
      };
      sceneRef.current.onNpcTap = (npc) => {
        onNpcTapRef.current?.(npc);
      };
      sceneRef.current.onMirrorTap = (mirror) => {
        onMirrorTapRef.current?.(mirror);
      };
      sceneRef.current.loadRoom(room, world);
      sceneRef.current.setBedtimePhase(bedtimePhase);
    }
  }, [room, world, bedtimePhase]);

  return (
    <div
      ref={containerRef}
      id="ztlo-phaser-canvas-container"
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ touchAction: "none" }}
    />
  );
};

export default PhaserContainer;

/**
 * Clean Next.js SSR-safe dynamic import export
 */
export const DynamicPhaserContainer = dynamic(
  () => Promise.resolve(PhaserContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-storybook-bg text-storybook-subtle">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Initializing Phaser Engine...</span>
        </div>
      </div>
    ),
  }
);
