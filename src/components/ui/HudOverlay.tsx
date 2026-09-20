"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export interface HudOverlayProps {
  roomName: string;
  objective: string;
  onResetRoom: () => void;
  onUndo?: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  roomName,
  objective,
  onResetRoom,
  onUndo,
}) => {
  return (
    <div className="flex items-center gap-3 pointer-events-auto select-none">
      {/* Undo / Reset Button: Minimum 48px hit target with clear accessible label */}
      <button
        type="button"
        onClick={onUndo || onResetRoom}
        aria-label="Undo move or reset room"
        className="h-12 px-4 rounded-xl bg-white shadow-md border border-storybook-muted flex items-center gap-2 text-storybook-subtle hover:text-storybook-text active:scale-95 transition-all cursor-pointer pointer-events-auto"
      >
        <RotateCcw className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Undo</span>
      </button>

      {/* Room Badge & Objective */}
      <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-storybook-muted flex flex-col pointer-events-auto">
        <span className="text-xs font-bold tracking-wide uppercase text-storybook-subtle">
          {roomName}
        </span>
        <span className="text-sm font-semibold text-storybook-text">
          {objective}
        </span>
      </div>
    </div>
  );
};
