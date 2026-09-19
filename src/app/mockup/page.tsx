"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Maximize2 } from "lucide-react";

export default function MockupPage() {
  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Game
          </Link>
          <span className="font-bold text-slate-400">|</span>
          <span className="font-bold text-amber-400 uppercase tracking-wider">
            Pediatric HCI Mockup: iPad Landscape (1194 × 834)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/mockup.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Standalone Window
          </a>
        </div>
      </div>

      {/* Embedded High-Fidelity Mockup Frame */}
      <div className="flex-1 w-full h-full relative">
        <iframe
          src="/mockup.html"
          title="Project ZTLO Pediatric HCI Frontend Mockup"
          className="w-full h-full border-0"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
