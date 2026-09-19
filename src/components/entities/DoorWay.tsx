"use client";

import React from "react";
import { motion } from "framer-motion";

interface DoorWayProps {
  size: number;
  isOpen?: boolean;
}

export const DoorWay: React.FC<DoorWayProps> = ({ size, isOpen = false }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
      animate={{ scale: isOpen ? [0.98, 1.02, 0.98] : 1 }}
      transition={{ duration: 2, repeat: isOpen ? Infinity : 0 }}
    >
      {/* Stone Arch Outline */}
      <path
        d="M12 70V28C12 16 24 8 40 8C56 8 68 16 68 28V70H12Z"
        fill="#CBD5E1"
        stroke="#64748B"
        strokeWidth="4"
      />

      {/* Door Inner Portal */}
      <path
        d="M20 70V30C20 22 28 16 40 16C52 16 60 22 60 30V70H20Z"
        fill={isOpen ? "#38BDF8" : "#475569"}
        fillOpacity={isOpen ? 0.75 : 1}
      />

      {isOpen ? (
        // Open glowing portal light rays
        <>
          <ellipse cx="40" cy="50" rx="14" ry="18" fill="#FFFFFF" fillOpacity="0.85" />
          <motion.circle
            cx="40"
            cy="45"
            r="8"
            fill="#E0F2FE"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </>
      ) : (
        // Closed gate iron bars
        <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
          <line x1="28" y1="26" x2="28" y2="70" />
          <line x1="40" y1="20" x2="40" y2="70" />
          <line x1="52" y1="26" x2="52" y2="70" />
          <line x1="20" y1="45" x2="60" y2="45" />
        </g>
      )}
    </motion.svg>
  );
};
