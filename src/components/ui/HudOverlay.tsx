"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

interface HudOverlayProps {
  roomName: string;
  objective: string;
  onResetRoom: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  roomName,
  objective,
  onResetRoom,
  onUndo,
  canUndo = false,
}) => {
  return (
    <div className="absolute top-4 left-4 z-40 flex items-center gap-4 pointer-events-auto select-none">
      {/* Reset Button: Fitts's Law >= 80px touch target */}
      <button
        type="button"
        onClick={onResetRoom}
        aria-label="Reset Room"
        className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl bg-white/95 backdrop-blur-sm shadow-md border-2 border-storybook-muted flex flex-col items-center justify-center gap-1 text-storybook-subtle hover:text-storybook-text hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
      >
        <RotateCcw className="w-6 h-6" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Reset</span>
      </button>

      {/* Undo / Rewind Button: Fitts's Law >= 80px touch target with curved arrow SVG */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last move"
        className={`w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl bg-white/95 backdrop-blur-sm shadow-md border-2 flex flex-col items-center justify-center gap-1 transition-all ${
          canUndo
            ? "border-amber-300 text-amber-700 hover:bg-amber-50 active:scale-95 cursor-pointer shadow-amber-100"
            : "border-slate-200 text-slate-300 opacity-50 cursor-not-allowed"
        }`}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider">Undo</span>
      </button>

      {/* Room Badge & Objective */}
      <div className="px-5 py-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border-2 border-storybook-muted flex flex-col justify-center min-h-[80px]">
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
