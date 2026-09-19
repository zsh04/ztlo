"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

interface HudOverlayProps {
  roomName: string;
  objective: string;
  onResetRoom: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  roomName,
  objective,
  onResetRoom,
}) => {
  return (
    <div className="absolute top-4 left-4 z-40 flex items-center gap-3 pointer-events-auto select-none">
      {/* Reset Button: Minimum 48px hit target */}
      <button
        type="button"
        onClick={onResetRoom}
        aria-label="Reset Room"
        className="w-12 h-12 rounded-xl bg-white shadow-md border border-storybook-muted flex items-center justify-center text-storybook-subtle active:scale-95 transition-transform"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Room Badge & Objective */}
      <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-storybook-muted flex flex-col">
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
