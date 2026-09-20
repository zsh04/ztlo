"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, ShieldCheck, RefreshCw, X, AlertCircle } from "lucide-react";

export interface ParentGateChallenge {
  numA: number;
  numB: number;
  operator: "+" | "×";
  expectedAnswer: number;
  questionText: string;
}

/**
 * Deterministic / Random challenge generator suitable for adult verification
 * while keeping problems out of reach of typical 5-6 year old early childhood learners.
 */
export function generateParentGateChallenge(): ParentGateChallenge {
  const isMult = Math.random() > 0.5;
  if (isMult) {
    const numA = Math.floor(Math.random() * 6) + 3; // 3 to 8
    const numB = Math.floor(Math.random() * 5) + 3; // 3 to 7
    return {
      numA,
      numB,
      operator: "×",
      expectedAnswer: numA * numB,
      questionText: `${numA} × ${numB}`,
    };
  } else {
    const numA = Math.floor(Math.random() * 12) + 11; // 11 to 22
    const numB = Math.floor(Math.random() * 14) + 8;  // 8 to 21
    return {
      numA,
      numB,
      operator: "+",
      expectedAnswer: numA + numB,
      questionText: `${numA} + ${numB}`,
    };
  }
}

/**
 * Validates a user response against the arithmetic challenge.
 */
export function verifyParentGateAnswer(
  challenge: ParentGateChallenge,
  rawInput: string | number
): boolean {
  if (rawInput === null || rawInput === undefined) return false;
  const parsed = typeof rawInput === "number" ? rawInput : parseInt(String(rawInput).trim(), 10);
  if (isNaN(parsed)) return false;
  return parsed === challenge.expectedAnswer;
}

export interface ParentGateProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  initialChallenge?: ParentGateChallenge;
}

export const ParentGate: React.FC<ParentGateProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  title = "Adult & Educator Verification",
  initialChallenge,
}) => {
  const [challenge, setChallenge] = useState<ParentGateChallenge>(
    () => initialChallenge ?? generateParentGateChallenge()
  );
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const regenerate = useCallback(() => {
    setChallenge(generateParentGateChallenge());
    setInputValue("");
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      regenerate();
    }
  }, [isOpen, regenerate]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifyParentGateAnswer(challenge, inputValue)) {
      setErrorMessage(null);
      onSuccess();
    } else {
      setShake(true);
      setErrorMessage("Incorrect answer. Please solve the updated problem below.");
      setTimeout(() => setShake(false), 500);
      setChallenge(generateParentGateChallenge());
      setInputValue("");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
    >
      <div
        className={`relative w-full max-w-md bg-white border-2 border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Close / Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel and return to game"
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pediatric Safety Gate
            </div>
            <h2 id="parent-gate-title" className="text-xl font-extrabold text-slate-800">
              {title}
            </h2>
          </div>
        </div>

        {/* Child Safety Context Notice */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          To protect Zyra&#39;s calm, distraction-free environment, please answer this adult arithmetic question to unlock cognitive mastery telemetry and educator reflection prompts:
        </p>

        {/* Challenge Box */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                What is:
              </span>
              <span className="text-3xl font-black text-slate-800 tracking-wider">
                {challenge.questionText} = ?
              </span>
            </div>

            <button
              type="button"
              onClick={regenerate}
              title="Get a different question"
              className="p-2 text-slate-500 hover:text-amber-700 hover:bg-white/80 rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Input & Action */}
          <div>
            <label htmlFor="parent-gate-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Enter Numeric Answer:
            </label>
            <input
              id="parent-gate-input"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 15"
              className="w-full h-14 text-center text-2xl font-black rounded-2xl border-2 border-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200 outline-none transition-all text-slate-900 bg-slate-50"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-1/2 h-12 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Return to Sanctuary
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-full sm:w-1/2 h-12 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unlock Dashboard
            </button>
          </div>
        </form>

        <div className="mt-5 text-center text-[11px] font-medium text-slate-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Strict COPPA &amp; FERPA Compliance: Zero PII Collected</span>
        </div>
      </div>
    </div>
  );
};
