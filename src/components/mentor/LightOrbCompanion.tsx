"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Mic } from "lucide-react";
import { SocraticDialog } from "../../types/game";
import {
  SOCRATIC_INQUIRY_CHIPS,
  determineLightOrbExpression,
  LightOrbExpression,
} from "../../ecs/systems/MentorSystem";
import type { MentorState } from "../../ecs/components";
import type { BedtimePhase } from "../../lib/bedtime/bedtimeManager";
import {
  speakText,
  stopSpeech,
  listenToChild,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from "../../lib/speech/webSpeech";

export interface LightOrbCompanionProps {
  dialog: SocraticDialog;
  inactiveSeconds: number;
  isOpen?: boolean;
  onOrbTap?: () => void;
  onCloseBubble?: () => void;
  onSelectChip?: (chipId: string) => void;
  onVoiceQuery?: (transcript: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  expression?: LightOrbExpression;
  bedtimePhase?: BedtimePhase;
  isBedtimeDimmed?: boolean;
  mentorState?: MentorState;
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
  onVoiceQuery,
  onUndo,
  canUndo = true,
  expression,
  bedtimePhase = "daylight",
  isBedtimeDimmed = false,
  mentorState,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningFeedback, setListeningFeedback] = useState<string | null>(null);

  const lastSpokenTextRef = useRef<string>("");
  const cancelListeningRef = useRef<(() => void) | null>(null);

  // Synchronize controlled vs uncontrolled open state
  const isDialogOpen = isOpen !== undefined ? isOpen : internalOpen;

  const isBedtimeTwilight =
    bedtimePhase === "twilight" || bedtimePhase === "bedtime" || Boolean(isBedtimeDimmed);

  const resolvedExpression: LightOrbExpression =
    expression ||
    determineLightOrbExpression({
      mentorState,
      promptType: dialog.promptType,
      isBedtime: isBedtimeTwilight,
      inactiveSeconds,
    });

  const isCornerTrap =
    dialog.text.includes("corner is tight") || dialog.text.includes("rewind one step");
  const isPulsing =
    inactiveSeconds >= 12 || dialog.promptType === "socratic_hint" || isCornerTrap || isListening;

  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    stopSpeech();
    if (cancelListeningRef.current) {
      cancelListeningRef.current();
      cancelListeningRef.current = null;
      setIsListening(false);
    }
    if (onCloseBubble) {
      onCloseBubble();
    }
    setInternalOpen(false);
  }, [onCloseBubble]);

  // Auto-dismiss pure encouragement / celebration messages after 3.5s so exit paths stay clear
  useEffect(() => {
    if (isDialogOpen && dialog.promptType === "encourage") {
      const timer = setTimeout(() => {
        handleClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isDialogOpen, dialog.promptType, handleClose]);

  const showInquiries =
    mentorState === "direct_hint_request" ||
    dialog.promptType === "socratic_hint" ||
    isCornerTrap;

  // Cleanly speak new Socratic messages aloud via TTS when bubble is open and unmuted
  useEffect(() => {
    if (
      isDialogOpen &&
      !isMuted &&
      isSpeechSynthesisSupported() &&
      dialog.text &&
      dialog.text !== lastSpokenTextRef.current
    ) {
      lastSpokenTextRef.current = dialog.text;
      speakText(dialog.text);
    }
  }, [dialog.text, isDialogOpen, isMuted]);

  // Cleanup active audio/speech when component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
      if (cancelListeningRef.current) {
        cancelListeningRef.current();
      }
    };
  }, []);

  const handleTap = () => {
    if (onOrbTap) {
      onOrbTap();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (nextMuted) {
        stopSpeech();
      } else if (dialog.text) {
        speakText(dialog.text);
      }
      return nextMuted;
    });
  };

  const handleStartListening = () => {
    if (isListening) {
      if (cancelListeningRef.current) {
        cancelListeningRef.current();
        cancelListeningRef.current = null;
      }
      setIsListening(false);
      return;
    }

    stopSpeech();
    setIsListening(true);
    setListeningFeedback("Listening... speak your question now!");

    const cancel = listenToChild({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript) => {
        setIsListening(false);
        setListeningFeedback(`You asked: "${transcript}"`);
        if (onVoiceQuery) {
          onVoiceQuery(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setListeningFeedback("Could not hear clearly. Try again or tap a question below!");
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    cancelListeningRef.current = cancel;
  };

  const handleChipClick = (chipId: string) => {
    if (onSelectChip) {
      onSelectChip(chipId);
    }
  };

  const hasSTT = isSpeechRecognitionSupported();

  return (
    <>
      <div className="relative z-40 flex flex-col items-end pointer-events-none">
        {/* Floating Light Orb Avatar - Fitts's Law >= 80px touch target */}
        <motion.button
          type="button"
          onClick={handleTap}
          aria-label="Light Orb Mentor"
          data-expression={resolvedExpression}
          data-bedtime={isBedtimeTwilight ? (bedtimePhase === "bedtime" ? "bedtime" : "twilight") : "daylight"}
          className={`w-20 h-20 min-w-[80px] min-h-[80px] rounded-full flex items-center justify-center cursor-pointer border-3 select-none pointer-events-auto transition-colors duration-500 ${
            isBedtimeTwilight
              ? "opacity-85 bg-gradient-to-tr from-indigo-200/90 via-purple-100 to-amber-100/90 shadow-lg border-purple-200/80 focus:outline-none focus:ring-4 focus:ring-purple-300/40"
              : "bg-gradient-to-tr from-amber-300 via-yellow-200 to-white shadow-xl border-amber-200/80 focus:outline-none focus:ring-4 focus:ring-amber-300/50"
          }`}
          animate={{
            y: [0, -8, 0],
            scale: isPulsing ? [1, 1.12, 1] : [1, 1.03, 1],
            boxShadow: isBedtimeTwilight
              ? isPulsing
                ? "0 0 18px rgba(167, 139, 250, 0.5)"
                : "0 0 10px rgba(196, 181, 253, 0.3)"
              : isPulsing
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
            <circle
              cx="20"
              cy="20"
              r="14"
              fill={isBedtimeTwilight ? "#FBF7EE" : "#FFFFFF"}
              fillOpacity={isBedtimeTwilight ? 0.85 : 0.9}
            />

            {/* Dynamic Facial Expressions */}
            {resolvedExpression === "happy" && (
              <>
                {/* Cheerful eyes with bright starlight catchlight */}
                <circle cx="15" cy="18" r="2" fill="#78350F" />
                <circle cx="14.3" cy="17.3" r="0.7" fill="#FFFFFF" />
                <circle cx="25" cy="18" r="2" fill="#78350F" />
                <circle cx="24.3" cy="17.3" r="0.7" fill="#FFFFFF" />
                {/* Rosy blush cheeks */}
                <circle cx="12" cy="21" r="1.8" fill="#FB7185" fillOpacity="0.45" />
                <circle cx="28" cy="21" r="1.8" fill="#FB7185" fillOpacity="0.45" />
                {/* Warm cheerful smile */}
                <path
                  d="M15 22C16.5 25.5 23.5 25.5 25 22"
                  stroke="#78350F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </>
            )}

            {resolvedExpression === "thinking" && (
              <>
                {/* Pondering eyes gazing upward right */}
                <circle cx="15" cy="18" r="1.8" fill="#78350F" />
                <circle cx="14.3" cy="17.4" r="0.6" fill="#FFFFFF" />
                <circle cx="25.5" cy="16.5" r="2.1" fill="#78350F" />
                <circle cx="26.1" cy="15.9" r="0.7" fill="#FFFFFF" />
                {/* Inquisitive eyebrow */}
                <path
                  d="M23.5 13.8C24.8 13.2 27 13.8 28 14.5"
                  stroke="#78350F"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Pondering "o" mouth */}
                <circle cx="20" cy="23.5" r="1.6" fill="#78350F" />
              </>
            )}

            {resolvedExpression === "curious" && (
              <>
                {/* Wide curious wonder eyes with double starlight reflections */}
                <circle cx="15" cy="17.5" r="2.6" fill="#78350F" />
                <circle cx="14" cy="16.5" r="0.9" fill="#FFFFFF" />
                <circle cx="15.8" cy="18.5" r="0.5" fill="#FFFFFF" />
                <circle cx="25" cy="17.5" r="2.6" fill="#78350F" />
                <circle cx="24" cy="16.5" r="0.9" fill="#FFFFFF" />
                <circle cx="25.8" cy="18.5" r="0.5" fill="#FFFFFF" />
                {/* Golden wonder blush */}
                <circle cx="11.5" cy="21.5" r="1.5" fill="#FBBF24" fillOpacity="0.5" />
                <circle cx="28.5" cy="21.5" r="1.5" fill="#FBBF24" fillOpacity="0.5" />
                {/* Soft open curious smile */}
                <path
                  d="M16.5 22.5C17.5 25 22.5 25 23.5 22.5"
                  stroke="#78350F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </>
            )}

            {resolvedExpression === "sleepy" && (
              <>
                {/* Peaceful closed resting eye arcs */}
                <path
                  d="M13 18C14 20 16 20 17 18"
                  stroke={isBedtimeTwilight ? "#6B21A8" : "#78350F"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M23 18C24 20 26 20 27 18"
                  stroke={isBedtimeTwilight ? "#6B21A8" : "#78350F"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Soothing lavender blush */}
                <circle cx="12" cy="21" r="2" fill="#C084FC" fillOpacity="0.4" />
                <circle cx="28" cy="21" r="2" fill="#C084FC" fillOpacity="0.4" />
                {/* Gentle peaceful sleeping smile */}
                <path
                  d="M18 23C19 24 21 24 22 23"
                  stroke={isBedtimeTwilight ? "#6B21A8" : "#78350F"}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                {/* Soft floating bedtime 'z' */}
                <text
                  x="27"
                  y="14"
                  fontSize="8"
                  fontWeight="bold"
                  fill={isBedtimeTwilight ? "#A855F7" : "#F59E0B"}
                  fillOpacity="0.75"
                >
                  z
                </text>
              </>
            )}
          </svg>
        </motion.button>

        {/* Socratic Dialogue Balloon & Voice Interaction Sheet */}
        <AnimatePresence>
          {isDialogOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mt-3 w-80 sm:w-96 max-w-[90vw] max-h-[82vh] overflow-y-auto p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-storybook-muted text-storybook-text text-sm font-medium relative flex flex-col gap-3 pointer-events-auto z-40"
            >
              {/* Header with speaker badge, audio mute toggle, and close button */}
              <div className="flex items-center justify-between pb-2 border-b border-storybook-muted/50">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {dialog.speaker}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Voice Audio Mute / Unmute Button */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute Voice" : "Mute Voice"}
                    title={isMuted ? "Unmute Voice" : "Mute Voice"}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-amber-600" />}
                  </button>

                  {/* Close Button: enlarged to 48x48px for pediatric iPad accessibility */}
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close thought"
                    className="w-12 h-12 min-w-[48px] min-h-[48px] bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full flex items-center justify-center text-slate-700 font-bold transition-colors cursor-pointer text-lg shadow-sm"
                  >
                    ✕
                  </button>
                </div>
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

              {/* Voice Interaction (STT) Button and Socratic Inquiry Chips */}
              {showInquiries && (
                <>
                  {hasSTT && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <motion.button
                        type="button"
                        onClick={handleStartListening}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full min-h-[56px] px-4 py-3 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer select-none ${
                          isListening
                            ? "bg-amber-100 border-amber-400 text-amber-950 shadow-md ring-4 ring-amber-300/60 animate-pulse"
                            : "bg-gradient-to-r from-amber-50/90 to-yellow-50/90 hover:from-amber-100 hover:to-yellow-100 border-amber-200 text-amber-900 shadow-sm"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isListening ? "bg-amber-500 text-white animate-bounce" : "bg-amber-300/80 text-amber-900"
                          }`}
                        >
                          <Mic className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className="text-xs sm:text-sm font-bold leading-tight">
                            {isListening ? "Listening... Speak to Zyra!" : "Talk to Light Orb"}
                          </span>
                          <span className="text-[11px] text-amber-700 font-medium truncate">
                            {listeningFeedback || "Tap and ask your question aloud"}
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  )}

                  {/* Pre-defined Socratic Inquiry Chips */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-storybook-muted/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Or Tap a Question
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
                </>
              )}

              {/* Bottom Dismissal Button for easy pediatric tap-to-close when inquiries are open */}
              {showInquiries && (
                <div className="pt-2 border-t border-storybook-muted/30">
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    whileTap={{ scale: 0.97 }}
                    className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm select-none"
                  >
                    <span>Keep Playing</span>
                    <span className="text-xs">✕</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
