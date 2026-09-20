"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocraticDialog } from "../../types/game";
import { SOCRATIC_INQUIRY_CHIPS } from "../../ecs/systems/MentorSystem";

interface LightOrbCompanionProps {
  dialog: SocraticDialog;
  inactiveSeconds: number;
  isOpen?: boolean;
  onOrbTap?: () => void;
  onCloseBubble?: () => void;
  onSelectChip?: (chipId: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

const CHIP_ICONS: Record<string, string> = {
  look_for: "🔍",
  why_stop: "💡",
  step_back: "↺",
};

export const LightOrbCompanion: React.FC<LightOrbCompanionProps> = ({
  dialog,
  inactiveSeconds,
  isOpen,
  onOrbTap,
  onCloseBubble,
  onSelectChip,
  onUndo,
  canUndo = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Synchronize controlled vs uncontrolled open state
  const isDialogOpen = isOpen !== undefined ? isOpen : internalOpen;

  const isCornerTrap =
    dialog.text.includes("corner is tight") || dialog.text.includes("rewind one step");
  const isPulsing =
    inactiveSeconds >= 12 || dialog.promptType === "socratic_hint" || isCornerTrap;

  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  const handleTap = () => {
    if (onOrbTap) {
      onOrbTap();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  const handleClose = () => {
    if (onCloseBubble) {
      onCloseBubble();
    }
    setInternalOpen(false);
  };

  const handleChipClick = (chipId: string) => {
    if (onSelectChip) {
      onSelectChip(chipId);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col items-end pointer-events-auto">
      {/* Floating Light Orb Avatar - Fitts's Law >= 80px touch target */}
      <motion.button
        type="button"
        onClick={handleTap}
        aria-label="Light Orb Mentor"
        className="w-20 h-20 min-w-[80px] min-h-[80px] rounded-full bg-gradient-to-tr from-amber-300 via-yellow-200 to-white shadow-xl flex items-center justify-center cursor-pointer border-3 border-amber-200/80 focus:outline-none focus:ring-4 focus:ring-amber-300/50 select-none"
        animate={{
          y: [0, -8, 0],
          scale: isPulsing ? [1, 1.12, 1] : [1, 1.03, 1],
          boxShadow: isPulsing
            ? "0 0 28px rgba(251, 191, 36, 0.85)"
            : "0 0 14px rgba(251, 191, 36, 0.45)",
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: isPulsing ? 1.4 : 2.6, repeat: Infinity, ease: "easeInOut" },
          boxShadow: { duration: isPulsing ? 1.4 : 2.6, repeat: Infinity, ease: "easeInOut" },
        }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="14" fill="#FFFFFF" fillOpacity="0.9" />
          {/* Gentle smiling face on the orb */}
          <circle cx="15" cy="18" r="1.8" fill="#78350F" />
          <circle cx="25" cy="18" r="1.8" fill="#78350F" />
          <path
            d="M16 23C17.5 25 22.5 25 24 23"
            stroke="#78350F"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </motion.button>

      {/* Socratic Dialogue Balloon & Inquiry Sheet */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-3 w-80 sm:w-96 max-w-[90vw] max-h-[82vh] overflow-y-auto p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-storybook-muted text-storybook-text text-sm font-medium relative flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-storybook-muted/50">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {dialog.speaker}
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close thought"
                className="w-10 h-10 min-w-[40px] min-h-[40px] text-slate-400 hover:text-slate-700 flex items-center justify-center rounded-lg transition-colors cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            {/* Current Mentor Message */}
            <p className="leading-relaxed text-slate-800 text-sm select-text bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              {dialog.text}
            </p>

            {/* Contextual Rewind Action button when Corner Trapped */}
            {isCornerTrap && onUndo && canUndo && (
              <motion.button
                type="button"
                onClick={onUndo}
                whileTap={{ scale: 0.96 }}
                className="w-full min-h-[56px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span className="text-lg">↺</span>
                <span>Rewind one step together</span>
              </motion.button>
            )}

            {/* Pre-defined Socratic Inquiry Chips */}
            <div className="flex flex-col gap-2 pt-1 border-t border-storybook-muted/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Ask the Light Orb
              </span>
              <div className="flex flex-col gap-2">
                {SOCRATIC_INQUIRY_CHIPS.map((chip) => (
                  <motion.button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipClick(chip.id)}
                    whileTap={{ scale: 0.97 }}
                    className="w-full min-h-[56px] p-3 rounded-xl bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 text-left flex items-center justify-between text-slate-700 font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg select-none" aria-hidden="true">
                        {CHIP_ICONS[chip.id] || "💬"}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {chip.label}
                      </span>
                    </div>
                    <span className="text-amber-500 text-base font-bold select-none">›</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
