"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocraticDialog } from "../../types/game";

interface LightOrbCompanionProps {
  dialog: SocraticDialog;
  inactiveSeconds: number;
  isOpen?: boolean;
  onOrbTap?: () => void;
  onCloseBubble?: () => void;
}

export const LightOrbCompanion: React.FC<LightOrbCompanionProps> = ({
  dialog,
  inactiveSeconds,
  isOpen,
  onOrbTap,
  onCloseBubble,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Synchronize controlled vs uncontrolled open state
  const isDialogOpen = isOpen !== undefined ? isOpen : internalOpen;

  const isPulsing = inactiveSeconds >= 12 || dialog.promptType === "socratic_hint";

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

      {/* Socratic Dialogue Balloon */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-3 max-w-sm p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-storybook-muted text-storybook-text text-sm font-medium relative"
          >
            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-storybook-muted/50">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {dialog.speaker}
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close thought"
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-md transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="leading-relaxed text-slate-800 text-sm select-text">
              {dialog.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
