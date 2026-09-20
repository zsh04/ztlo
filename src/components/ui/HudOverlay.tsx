"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export interface HudOverlayProps {
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
    <div className="flex items-center gap-4 pointer-events-auto select-none">
      {/* Reset Button: Fitts's Law >= 80px touch target */}
      <button
        type="button"
        onClick={onResetRoom}
        aria-label="Reset Room"
        className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl bg-[#FDFBF7]/95 backdrop-blur-sm shadow-md border-2 border-[#E2D9C8] flex flex-col items-center justify-center gap-1 text-amber-800 hover:text-amber-950 hover:border-[#D4AF37] active:scale-95 transition-all cursor-pointer pointer-events-auto"
      >
        <RotateCcw className="w-6 h-6 text-amber-700" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Reset</span>
      </button>

      {/* Undo / Rewind Button: Fitts's Law >= 80px touch target with curved arrow SVG */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last move"
        className={`w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl bg-[#FDFBF7]/95 backdrop-blur-sm shadow-md border-2 flex flex-col items-center justify-center gap-1 transition-all pointer-events-auto ${
          canUndo
            ? "border-[#D4AF37] text-amber-800 hover:bg-amber-50 active:scale-95 cursor-pointer shadow-amber-100/50"
            : "border-[#E2D9C8]/60 text-slate-300 opacity-50 cursor-not-allowed"
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
      <div className="px-5 py-3 bg-[#FDFBF7]/95 backdrop-blur-sm rounded-2xl shadow-md border-2 border-[#E2D9C8] flex flex-col justify-center min-h-[80px] pointer-events-auto">
        <span className="text-xs font-bold tracking-wide uppercase text-amber-700">
          {roomName}
        </span>
        <span className="text-sm font-semibold text-slate-800">
          {objective}
        </span>
      </div>
    </div>
  );
};
