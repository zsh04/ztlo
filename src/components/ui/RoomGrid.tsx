"use client";

import React from "react";
import { motion } from "framer-motion";
import { Entity } from "../../ecs/entities";
import { GridPoint, TouchFeedbackEvent } from "../../types/game";
import { PlayerAvatar } from "../entities/PlayerAvatar";
import { StoneBlock } from "../entities/StoneBlock";
import { IceBlock } from "../entities/IceBlock";
import { PressurePlate } from "../entities/PressurePlate";
import { DoorWay } from "../entities/DoorWay";

interface RoomGridProps {
  width: number;
  height: number;
  entities: Entity[];
  onCellTap: (point: GridPoint, screenX: number, screenY: number) => void;
  cellSize: number;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  width,
  height,
  entities,
  onCellTap,
  cellSize,
}) => {
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    x: number,
    y: number
  ) => {
    e.preventDefault();
    const clickX = typeof e.clientX === "number" ? e.clientX : e.currentTarget.getBoundingClientRect().left;
    const clickY = typeof e.clientY === "number" ? e.clientY : e.currentTarget.getBoundingClientRect().top;
    onCellTap({ x, y }, clickX, clickY);
  };

  return (
    <div
      className="relative mx-auto rounded-3xl p-4 bg-storybook-muted/30 shadow-inner border-2 border-storybook-border/40 select-none overflow-hidden"
      style={{
        width: width * cellSize + 32,
        height: height * cellSize + 32,
        touchAction: "none",
      }}
    >
      {/* 16x9 CSS Grid Floor Tiles */}
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          width: width * cellSize,
          height: height * cellSize,
          touchAction: "none",
        }}
      >
        {Array.from({ length: height }).map((_, y) =>
          Array.from({ length: width }).map((_, x) => {
            const isAlternate = (x + y) % 2 === 0;
            return (
              <div
                key={`cell-${x}-${y}`}
                onPointerDown={(e) => handlePointerDown(e, x, y)}
                style={{ width: cellSize, height: cellSize }}
                className={`border border-storybook-muted/30 rounded-xl transition-colors cursor-pointer ${
                  isAlternate ? "bg-storybook-bg/70" : "bg-white/40"
                } active:bg-storybook-interactable-soft/50`}
              />
            );
          })
        )}

        {/* Entities Layer */}
        {entities.map((entity) => {
          const left = entity.position.x * cellSize;
          const top = entity.position.y * cellSize;

          let content: React.ReactNode = null;
          if (entity.renderable.shape === "avatar") {
            content = (
              <PlayerAvatar
                size={cellSize}
                isMoving={entity.movement?.isMoving}
              />
            );
          } else if (entity.renderable.shape === "stone") {
            content = <StoneBlock size={cellSize} />;
          } else if (entity.renderable.shape === "ice") {
            content = <IceBlock size={cellSize} />;
          } else if (entity.renderable.shape === "plate") {
            content = (
              <PressurePlate
                size={cellSize}
                isDepressed={entity.trigger?.isDepressed}
              />
            );
          } else if (entity.renderable.shape === "door") {
            const isOpen = entity.collider ? !entity.collider.isSolid : false;
            content = <DoorWay size={cellSize} isOpen={isOpen} />;
          } else if (entity.renderable.shape === "wall") {
            content = (
              <div
                style={{ width: cellSize - 6, height: cellSize - 6 }}
                className="rounded-xl bg-slate-700 border-2 border-slate-800 shadow-md flex items-center justify-center select-none"
              >
                <div className="w-1/2 h-1/2 rounded-md bg-slate-600/70 border border-slate-500/50" />
              </div>
            );
          }

          return (
            <motion.div
              key={entity.id}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                width: cellSize,
                height: cellSize,
                zIndex: entity.renderable.zIndex,
              }}
              initial={false}
              animate={{
                x: left,
                y: top,
              }}
              transition={{
                duration: entity.pushable?.isSliding
                  ? 0.35
                  : entity.movement?.isMoving
                  ? (entity.movement.stepIntervalMs ? entity.movement.stepIntervalMs / 1000 : 0.15)
                  : 0.22,
                ease: entity.pushable?.isSliding ? "easeOut" : entity.movement?.isMoving ? "linear" : "easeInOut",
              }}
            >
              {content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
