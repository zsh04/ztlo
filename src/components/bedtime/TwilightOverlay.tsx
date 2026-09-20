"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Star, Sparkles, Clock, Heart } from "lucide-react";
import { BedtimePhase, BEDTIME_PROMPT } from "@/lib/bedtime/bedtimeManager";

export interface TwilightOverlayProps {
  phase: BedtimePhase;
  remainingSeconds: number;
  onExtend?: () => void;
  onClose?: () => void;
}

export function TwilightOverlay({
  phase,
  remainingSeconds,
  onExtend,
  onClose,
}: TwilightOverlayProps) {
  // Generate deterministic stars for starry sky
  const stars = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: ((i * 37) % 94) + 3,
      y: ((i * 53) % 88) + 4,
      size: (i % 3) + 2,
      delay: (i % 5) * 0.4,
      duration: (i % 4) * 0.8 + 2,
    }));
  }, []);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* 1. Ambient Twilight Dusk Filter (Non-blocking) */}
      <div
        data-testid="twilight-ambient-filter"
        className={`fixed inset-0 z-40 transition-opacity duration-1000 ease-in-out pointer-events-none ${
          phase === "twilight"
            ? "opacity-30 bg-gradient-to-b from-[#4c1d95] via-[#312e81] to-[#ea580c]"
            : "opacity-0"
        }`}
      />

      {/* 2. Twilight Ambient Banner (Subtle, non-intrusive reminder) */}
      <AnimatePresence>
        {phase === "twilight" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/30 text-amber-200 text-sm font-medium shadow-lg">
              <Moon className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Twilight Glow • {formatTime(remainingSeconds)} until bedtime</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Bedtime Starry Sky Canopy & Off-ramp Card */}
      <AnimatePresence>
        {phase === "bedtime" && (
          <motion.div
            data-testid="bedtime-starry-canopy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#0a0f1d] via-[#111827] to-[#1e1b4b] overflow-hidden"
          >
            {/* Animated Twinkling SVG Stars */}
            <div className="absolute inset-0 pointer-events-none">
              {stars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute rounded-full bg-amber-100"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                  }}
                  animate={{
                    opacity: [0.2, 0.9, 0.2],
                    scale: [0.8, 1.3, 0.8],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: star.duration,
                    delay: star.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Glowing Moon Illustration */}
            <div className="absolute top-10 right-14 w-28 h-28 rounded-full bg-gradient-to-br from-amber-100 to-amber-200/30 blur-[1px] shadow-[0_0_50px_rgba(251,191,36,0.35)] flex items-center justify-center pointer-events-none opacity-80">
              <Moon className="w-16 h-16 text-amber-100/90 fill-amber-100/40" />
            </div>

            {/* Restful Bedtime Dialog Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative z-10 max-w-lg w-full mx-6 p-8 rounded-3xl bg-slate-900/90 border border-indigo-400/30 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center gap-6"
            >
              {/* Light Orb Sleepy Avatar */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-300 via-amber-200 to-indigo-200 flex items-center justify-center shadow-[0_0_35px_rgba(251,191,36,0.5)]">
                <Sparkles className="w-12 h-12 text-amber-800 animate-spin-slow" />
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-900 border border-amber-300">
                  <Moon className="w-5 h-5 text-amber-300 fill-amber-300/40" />
                </div>
              </div>

              {/* Gentle Bedtime Story Title */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-amber-100 tracking-wide">
                  Sweet Dreams, Zyra
                </h2>
                <p className="text-indigo-200 text-base leading-relaxed px-2">
                  {BEDTIME_PROMPT}
                </p>
              </div>

              {/* Pediatric HCI Compliant Touch Controls (>= 80px target sizes) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-2">
                {/* Primary Rest Button (Fitts's Law compliant >= 80px) */}
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[160px] min-h-[80px] px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Heart className="w-6 h-6 text-rose-300 fill-rose-300/40" />
                  <span>Rest Tonight</span>
                </button>

                {/* Parental Extension Button (+5m, >= 80px touch target) */}
                {onExtend && (
                  <button
                    type="button"
                    onClick={onExtend}
                    className="min-w-[160px] min-h-[80px] px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-400/30 text-indigo-200 hover:text-white font-medium text-base shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Clock className="w-5 h-5 text-amber-300" />
                    <span>5 More Mins</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
