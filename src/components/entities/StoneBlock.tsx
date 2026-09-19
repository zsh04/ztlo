"use client";

import React from "react";
import { motion } from "framer-motion";

interface StoneBlockProps {
  size: number;
}

export const StoneBlock: React.FC<StoneBlockProps> = ({ size }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
    >
      {/* Base Shadow */}
      <rect x="6" y="10" width="68" height="66" rx="12" fill="#475569" />

      {/* Main Stone Body */}
      <rect x="6" y="6" width="68" height="66" rx="12" fill="#94A3B8" />

      {/* Top Bevel Highlight */}
      <rect x="8" y="8" width="64" height="20" rx="10" fill="#CBD5E1" fillOpacity="0.4" />

      {/* Engraved Rune / Weight Symbol (Warm complementary highlight) */}
      <circle cx="40" cy="39" r="14" stroke="#F97316" strokeWidth="4" fill="#64748B" fillOpacity="0.3" />
      <path
        d="M40 31V47M32 39H48"
        stroke="#F97316"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};
