"use client";

import React from "react";
import { motion } from "framer-motion";

interface PlayerAvatarProps {
  size: number;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ size }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm select-none"
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.98, 1.02, 0.98] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Soft Ground Shadow */}
      <ellipse cx="40" cy="72" rx="24" ry="6" fill="#000000" fillOpacity="0.12" />

      {/* Cape / Poncho (Warm Storybook Terracotta / Coral) */}
      <path
        d="M26 40C26 34 32 30 40 30C48 30 54 34 54 40L58 64C58 66 56 68 54 68H26C24 68 22 66 22 64L26 40Z"
        fill="#F97316"
      />
      {/* Cape Hem Detail */}
      <path
        d="M22 64C28 62 52 62 58 64L54 68H26L22 64Z"
        fill="#EA580C"
      />

      {/* Head / Face (Warm Neutral) */}
      <circle cx="40" cy="26" r="16" fill="#FED7AA" />

      {/* Hair (Soft Deep Navy / Charcoal) */}
      <path
        d="M24 24C24 15 31 10 40 10C49 10 56 15 56 24C56 28 54 32 54 32C50 28 48 26 40 26C32 26 30 28 26 32C26 32 24 28 24 24Z"
        fill="#1E293B"
      />

      {/* Expressive Eyes (Clean minimal dots) */}
      <circle cx="34" cy="26" r="2.5" fill="#0F172A" />
      <circle cx="46" cy="26" r="2.5" fill="#0F172A" />
      <circle cx="35" cy="25" r="0.8" fill="#FFFFFF" />
      <circle cx="47" cy="25" r="0.8" fill="#FFFFFF" />

      {/* Little Explorer Headband Feather */}
      <path
        d="M48 12C52 6 58 4 58 4C58 4 56 10 52 14L48 12Z"
        fill="#FBBF24"
      />
    </motion.svg>
  );
};
