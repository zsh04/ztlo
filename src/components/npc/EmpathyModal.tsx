"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Entity } from "../../ecs/entities";
import { Sparkles, Heart, Wind, Flower2, X } from "lucide-react";

export interface EmpathyModalProps {
  isOpen: boolean;
  npc: Entity | null;
  onClose: () => void;
  onCompleteBreathing: () => void;
  onOfferGift: (gift: string) => void;
}

export const EmpathyModal: React.FC<EmpathyModalProps> = ({
  isOpen,
  npc,
  onClose,
  onCompleteBreathing,
  onOfferGift,
}) => {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");
  const [countdown, setCountdown] = useState(4);

  const isSoothed = npc?.npc?.isSoothed || false;
  const npcName = npc?.npc?.name || "Sprout";

  // Reset breathing states on open
  useEffect(() => {
    if (isOpen) {
      setIsBreathing(false);
      setBreathPhase("inhale");
      setCountdown(4);
    }
  }, [isOpen]);

  // Guided Co-Breathing Loop (4s Inhale, 4s Exhale)
  useEffect(() => {
    if (!isBreathing || isSoothed) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (breathPhase === "inhale") {
            setBreathPhase("exhale");
            return 4;
          } else {
            // Completed 1 full 8-second co-breathing cycle!
            setIsBreathing(false);
            onCompleteBreathing();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathing, breathPhase, isSoothed, onCompleteBreathing]);

  if (!isOpen || !npc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm pointer-events-auto select-none">
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-3 border-amber-200 text-storybook-text flex flex-col items-center text-center overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close empathy dialogue"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* NPC Portrait with Dynamic Mood Aura */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Glowing Mood Aura Halo */}
            <motion.div
              animate={{
                scale: isSoothed ? [1, 1.25, 1] : [1, 1.12, 1],
                opacity: isSoothed ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: isSoothed ? 2 : 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-28 h-28 rounded-full"
              style={{
                backgroundColor: isSoothed ? "#FDE047" : "#F59E0B",
                filter: "blur(18px)",
              }}
            />

            {/* Character Avatar */}
            <div className="relative w-24 h-24 rounded-full bg-emerald-100 border-3 border-emerald-400 flex items-center justify-center shadow-inner">
              <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
                {/* Forest Spirit Sprout Avatar */}
                <ellipse cx="24" cy="27" rx="14" ry="13" fill="#10B981" />
                {/* Head Sprout Leaves */}
                <path
                  d="M24 14C24 9 20 7 16 9C16 13 20 14 24 14Z"
                  fill="#34D399"
                  stroke="#059669"
                  strokeWidth="1.5"
                />
                <path
                  d="M24 14C24 9 28 7 32 9C32 13 28 14 24 14Z"
                  fill="#34D399"
                  stroke="#059669"
                  strokeWidth="1.5"
                />
                <path d="M24 17V14" stroke="#047857" strokeWidth="2" strokeLinecap="round" />

                {/* Expressive Face */}
                {isSoothed ? (
                  <>
                    {/* Happy Curved Eyes */}
                    <path
                      d="M18 25C19 23 21 23 22 25"
                      stroke="#064E3B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M26 25C27 23 29 23 30 25"
                      stroke="#064E3B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Sweet Smile */}
                    <path
                      d="M20 30C22 32 26 32 28 30"
                      stroke="#064E3B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Rosy Cheeks */}
                    <circle cx="16" cy="28" r="2.5" fill="#FCA5A5" fillOpacity="0.7" />
                    <circle cx="32" cy="28" r="2.5" fill="#FCA5A5" fillOpacity="0.7" />
                  </>
                ) : (
                  <>
                    {/* Worried Eyes */}
                    <circle cx="20" cy="25" r="2.5" fill="#064E3B" />
                    <circle cx="28" cy="25" r="2.5" fill="#064E3B" />
                    <circle cx="19" cy="24" r="0.8" fill="#FFFFFF" />
                    <circle cx="27" cy="24" r="0.8" fill="#FFFFFF" />
                    {/* Trembly Mouth */}
                    <path
                      d="M21 31C22 30 23 32 24 31C25 30 26 32 27 31"
                      stroke="#064E3B"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* NPC Name & Emotion Header */}
          <h3 className="text-lg font-bold text-slate-800">{npcName} the Forest Spirit</h3>
          <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            {isSoothed ? (
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Peaceful & Safe
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                Feeling Anxious & Overwhelmed
              </span>
            )}
          </div>

          {/* Socratic Emotion Dialogue */}
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium leading-relaxed">
            {isSoothed ? (
              <p className="text-emerald-900 font-semibold">{npc.npc?.soothedDialog}</p>
            ) : (
              <p>&ldquo;{npc.npc?.dialogPrompt}&rdquo;</p>
            )}
          </div>

          {/* Interactive Soothing Options */}
          {!isSoothed ? (
            <div className="mt-5 w-full flex flex-col gap-3">
              {isBreathing ? (
                /* Active Guided Co-Breathing Ring */
                <div className="flex flex-col items-center justify-center p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <motion.div
                    animate={{
                      scale: breathPhase === "inhale" ? [1, 1.45] : [1.45, 1],
                    }}
                    transition={{
                      duration: 4,
                      ease: "easeInOut",
                    }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 to-sky-300 shadow-lg flex items-center justify-center text-white font-bold text-lg"
                  >
                    {countdown}s
                  </motion.div>
                  <span className="mt-3 text-sm font-bold text-amber-900">
                    {breathPhase === "inhale" ? "Breathe in with Sprout... 🌱" : "Breathe out gently... 🍃"}
                  </span>
                </div>
              ) : (
                <>
                  {/* Co-Breathing Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsBreathing(true)}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wind className="w-5 h-5" />
                    <span>Breathe with Sprout (4s Cycle)</span>
                  </button>

                  {/* Gift Offering Trigger */}
                  <button
                    type="button"
                    onClick={() => onOfferGift("Lavender Wildflower")}
                    className="w-full h-14 rounded-2xl bg-white border-2 border-purple-200 text-purple-700 font-bold shadow-sm hover:bg-purple-50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Flower2 className="w-5 h-5 text-purple-500" />
                    <span>Offer Lavender Blossom 🌸</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Unlocked Progression State */
            <div className="mt-5 w-full">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Walk Into the Grove Gate</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
