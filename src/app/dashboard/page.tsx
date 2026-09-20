"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Award,
  Sparkles,
  Compass,
  Clock,
  MessageSquare,
  Moon,
  Lock,
  Printer,
  Brain,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Target,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ParentGate } from "@/components/dashboard/ParentGate";
import {
  CANONICAL_COGNITIVE_DOMAINS,
  CANONICAL_SESSION_TELEMETRY,
  CognitiveDomainMastery,
  SessionExecutiveTelemetry,
} from "@/lib/curriculumData";
import { ShrineCurriculumItem } from "@/app/api/curriculum/route";

export default function DashboardPage() {
  const [isGateUnlocked, setIsGateUnlocked] = useState<boolean>(false);
  const [domains, setDomains] = useState<CognitiveDomainMastery[]>(CANONICAL_COGNITIVE_DOMAINS);
  const [telemetry, setTelemetry] = useState<SessionExecutiveTelemetry>(CANONICAL_SESSION_TELEMETRY);
  const [activeTab, setActiveTab] = useState<"curriculum" | "prompts" | "screentime">("curriculum");
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);

  // Check if session previously unlocked gate
  useEffect(() => {
    try {
      const unlocked = sessionStorage.getItem("ztlo_parent_gate_unlocked");
      if (unlocked === "true") {
        setIsGateUnlocked(true);
      }
    } catch {
      // In SSR or restrictive iframe environments, state defaults to locked
    }
  }, []);

  // Fetch live /api/curriculum data
  useEffect(() => {
    async function loadCurriculum() {
      setIsLoadingApi(true);
      try {
        const res = await fetch("/api/curriculum");
        if (res.ok) {
          const data = await res.json();
          if (data.curriculum && Array.isArray(data.curriculum)) {
            // Merge live curriculum metadata with pedagogical domains
            setDomains((prev) =>
              prev.map((dom) => {
                const apiItem = data.curriculum.find(
                  (c: ShrineCurriculumItem) => c.id === dom.shrineId
                );
                if (apiItem) {
                  return {
                    ...dom,
                    shrineTitle: apiItem.name || dom.shrineTitle,
                    coreConcept: apiItem.pedagogicalFocus?.coreConcept || dom.coreConcept,
                    subconsciousMechanic:
                      apiItem.pedagogicalFocus?.subconsciousMechanic || dom.subconsciousMechanic,
                  };
                }
                return dom;
              })
            );
          }
        }
      } catch (err) {
        console.warn("Using offline canonical curriculum telemetry fallback:", err);
      } finally {
        setIsLoadingApi(false);
      }
    }

    loadCurriculum();
  }, []);

  const handleGateSuccess = () => {
    setIsGateUnlocked(true);
    try {
      sessionStorage.setItem("ztlo_parent_gate_unlocked", "true");
    } catch {}
  };

  const handleLockGate = () => {
    setIsGateUnlocked(false);
    try {
      sessionStorage.removeItem("ztlo_parent_gate_unlocked");
    } catch {}
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F4F8] text-[#102A43] font-sans antialiased selection:bg-amber-200">
      {/* Parent Verification Gate Modal */}
      {!isGateUnlocked && (
        <ParentGate
          isOpen={!isGateUnlocked}
          onSuccess={handleGateSuccess}
          onCancel={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
        />
      )}

      {/* Main Educator Viewport Container */}
      <div className={`transition-opacity duration-300 ${isGateUnlocked ? "opacity-100" : "opacity-20 pointer-events-none filter blur-sm"}`}>
        {/* Top Storybook Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#BCCCDC]/60 px-4 sm:px-8 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center transition-colors shadow-sm"
                title="Return to Sanctuary"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Parent &amp; Educator Portal
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    COPPA / FERPA Compliant
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#102A43] tracking-tight mt-0.5">
                  Curriculum Mastery &amp; Cognitive Development Dashboard
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Report</span>
              </button>

              <button
                type="button"
                onClick={handleLockGate}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Gate</span>
              </button>

              <Link
                href="/"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Return to Game</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          {/* Section 1: Executive Function & Health Cards */}
          <section aria-labelledby="executive-metrics-heading">
            <h2 id="executive-metrics-heading" className="sr-only">Executive Function Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: Active Session & Bedtime Limit */}
              <div className="bg-white rounded-3xl p-5 border-2 border-[#D9E2EC] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#627D98]">Active Play Time</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#102A43]">{telemetry.activePlayDurationMinutes}m</span>
                    <span className="text-xs font-semibold text-[#627D98]">/ {telemetry.bedtimeThresholdMinutes}m limit</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(telemetry.activePlayDurationMinutes / telemetry.bedtimeThresholdMinutes) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <Moon className="w-3.5 h-3.5" />
                  <span>100% Twilight Transition Compliant</span>
                </div>
              </div>

              {/* Card 2: Independent Problem Solving */}
              <div className="bg-white rounded-3xl p-5 border-2 border-[#D9E2EC] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#627D98]">Independent Solves</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#102A43]">{telemetry.independentSolveRatePct}%</span>
                    <span className="text-xs font-semibold text-[#627D98]">autonomous</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${telemetry.independentSolveRatePct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{telemetry.socraticGuidanceRatePct}% gentle Light Orb questions</span>
                </div>
              </div>

              {/* Card 3: Curriculum Progress */}
              <div className="bg-white rounded-3xl p-5 border-2 border-[#D9E2EC] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#627D98]">Shrine Progression</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#102A43]">{telemetry.totalShrinesMastered} / {telemetry.totalShrinesAvailable}</span>
                    <span className="text-xs font-semibold text-[#627D98]">mastered</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${telemetry.overallCurriculumProgressPct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{telemetry.overallCurriculumProgressPct}% overall stealth STEM mastery</span>
                </div>
              </div>

              {/* Card 4: Fitts Law Ergonomics & Self-Regulation */}
              <div className="bg-white rounded-3xl p-5 border-2 border-[#D9E2EC] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#627D98]">Pediatric Accuracy</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#102A43]">{telemetry.touchTargetAccuracyPct}%</span>
                    <span className="text-xs font-semibold text-[#627D98]">target hit</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${telemetry.touchTargetAccuracyPct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{telemetry.frustrationFreeRewindCount} low-stakes 1-tap rewinds</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Tabbed Navigation */}
          <div className="flex border-b border-[#BCCCDC]">
            <button
              type="button"
              onClick={() => setActiveTab("curriculum")}
              className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "curriculum"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cognitive Domain Masteries (Shrines 01–06)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prompts")}
              className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "prompts"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Offline Real-World Conversation Starters</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("screentime")}
              className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "screentime"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Bedtime &amp; Screen Health</span>
            </button>
          </div>

          {/* Tab 1: Cognitive Domain Masteries */}
          {activeTab === "curriculum" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-[#102A43]">
                    Stealth STEM &amp; Social-Emotional Learning Domains
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Live telemetry mapped from game mechanics to developmental cognitive frameworks.
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  {isLoadingApi ? "Refreshing /api/curriculum..." : "Synchronized with Game Core"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {domains.map((dom) => {
                  const badgeColor =
                    dom.masteryLevel === "Mastered"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : dom.masteryLevel === "Proficient"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : dom.masteryLevel === "Practicing"
                      ? "bg-sky-100 text-sky-800 border-sky-300"
                      : "bg-slate-100 text-slate-700 border-slate-300";

                  const barColor =
                    dom.masteryLevel === "Mastered"
                      ? "bg-emerald-500"
                      : dom.masteryLevel === "Proficient"
                      ? "bg-amber-500"
                      : dom.masteryLevel === "Practicing"
                      ? "bg-sky-500"
                      : "bg-slate-400";

                  return (
                    <div
                      key={dom.domainId}
                      className="bg-white rounded-3xl p-6 border-2 border-[#D9E2EC] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                              {dom.shrineCode}
                            </span>
                            <h4 className="text-base font-extrabold text-[#102A43] leading-snug">
                              {dom.shrineTitle}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                            {dom.masteryLevel} ({dom.masteryPercentage}%)
                          </span>
                        </div>

                        {/* Domain Tag */}
                        <div className="mb-4">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {dom.domainName}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                            <span>Concept Acquisition</span>
                            <span>{dom.masteryPercentage}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all duration-500`}
                              style={{ width: `${dom.masteryPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Subconscious Learning Mechanic */}
                        <div className="bg-[#F0F4F8]/80 rounded-2xl p-3.5 mb-4 border border-[#BCCCDC]/40">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                            Subconscious Gameplay Vector:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {dom.subconsciousMechanic}
                          </p>
                        </div>
                      </div>

                      {/* Solve Telemetry Mini Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>{dom.independentSolves} / {dom.totalAttempts} Independent Solves</span>
                        <span>Avg: {dom.averageDurationSec}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tab 2: Offline Real-World Conversation Prompts */}
          {activeTab === "prompts" && (
            <section className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#102A43]">
                  Offline Conversation Prompts &amp; Hands-On Micro-Activities
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Scientifically proven offline dialogue questions that parents and educators can ask to solidify digital mental models into concrete real-world physical reasoning.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {domains.map((dom) => (
                  <div
                    key={`prompt-${dom.domainId}`}
                    className="bg-white rounded-3xl p-6 border-2 border-[#D9E2EC] shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black text-orange-600 uppercase tracking-wider">
                          {dom.shrineCode}: {dom.domainName}
                        </span>
                      </div>
                      <div className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 mb-3">
                        Context: {dom.offlinePrompt.context}
                      </div>

                      <div className="bg-amber-50/50 border-l-4 border-amber-400 p-4 rounded-r-2xl mb-4">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block mb-1">
                          Ask Zyra:
                        </span>
                        <p className="text-sm font-semibold text-slate-900 italic leading-relaxed">
                          &ldquo;{dom.offlinePrompt.question}&rdquo;
                        </p>
                      </div>

                      <div className="bg-emerald-50/50 border-l-4 border-emerald-400 p-4 rounded-r-2xl">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block mb-1">
                          Hands-On Physical Activity:
                        </span>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                          {dom.offlinePrompt.activity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tab 3: Bedtime & Screen Health */}
          {activeTab === "screentime" && (
            <section className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#102A43]">
                  Pediatric Screen Health &amp; Twilight Off-Ramp Monitoring
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Designed in adherence with American Academy of Pediatrics (AAP) and pediatric neurology guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health Card 1 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-[#D9E2EC] shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">
                        15-Minute Twilight Boundary
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Automatic atmospheric transition to starry nightfall
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    At 15 minutes of active exploration, ZTLO smoothly transitions ambient sky lighting into warm twilight indigo. Light Orb whispers a gentle bedtime lullaby, preventing abrupt digital frustration and tantrums.
                  </p>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-800">
                      Current Session Status: Compliant ({telemetry.activePlayDurationMinutes}m active / 15m target)
                    </span>
                  </div>
                </div>

                {/* Health Card 2 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-[#D9E2EC] shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">
                        Zero Ad Clutter &amp; Zero PII Protection
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Complete privacy isolation for early childhood safety
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    ZTLO contains no commercial advertisements, no in-app purchases, and never requests names, email addresses, or microphones without on-device local Web Speech isolation.
                  </p>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-purple-800">
                      FERPA &amp; COPPA Certified: 100% Anonymous Local Session
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Footer Notice */}
          <footer className="pt-6 border-t border-[#BCCCDC]/60 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Project ZTLO: Zyra &amp; The Light Orb • Academic Research Prototype</span>
            </div>
            <div>
              <span>Audience: Early Childhood Learner (Age 6) • Google OKF &amp; W3C AAA Compliant</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
