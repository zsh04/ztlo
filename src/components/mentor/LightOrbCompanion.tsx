"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocraticDialog } from "../../types/game";

interface LightOrbCompanionProps {
  dialog: SocraticDialog;
  inactiveSeconds: number;
  onOrbTap?: () => void;
}

export const LightOrbCompanion: React.FC<LightOrbCompanionProps> = ({
  dialog,
  inactiveSeconds,
  onOrbTap,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isPulsing = inactiveSeconds >= 12;

  // Auto-open gentle hint when user is stuck for > 18 seconds
  useEffect(() => {
    if (inactiveSeconds >= 18) {
      setIsDialogOpen(true);
    }
  }, [inactiveSeconds]);

  const handleTap = () => {
    setIsDialogOpen((prev) => !prev);
    if (onOrbTap) onOrbTap();
  };

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col items-end pointer-events-auto">
      {/* Floating Light Orb Avatar */}
      <motion.button
        type="button"
        onClick={handleTap}
        aria-label="Light Orb Mentor"
        className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-200 to-white shadow-lg flex items-center justify-center cursor-pointer border-2 border-amber-200 focus:outline-none"
        animate={{
          y: [0, -6, 0],
          scale: isPulsing ? [1, 1.14, 1] : [1, 1.03, 1],
          boxShadow: isPulsing
            ? "0 0 24px rgba(251, 191, 36, 0.7)"
            : "0 0 12px rgba(251, 191, 36, 0.4)",
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: isPulsing ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" },
        }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="12" fill="#FFFFFF" fillOpacity="0.9" />
          {/* Gentle smiling face on the orb */}
          <circle cx="16" cy="18" r="1.5" fill="#78350F" />
          <circle cx="24" cy="18" r="1.5" fill="#78350F" />
          <path
            d="M17 23C18 24.5 22 24.5 23 23"
            stroke="#78350F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </motion.button>

      {/* Socratic Dialogue Balloon */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 max-w-sm p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-storybook-muted text-storybook-text text-sm font-medium"
          >
            <div className="flex items-center justify-between mb-1 pb-1 border-b border-storybook-muted/40">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                {dialog.speaker}
              </span>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="text-storybook-subtle hover:text-storybook-text text-xs p-1"
              >
                ✕
              </button>
            </div>
            <p className="leading-relaxed text-slate-800">{dialog.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
