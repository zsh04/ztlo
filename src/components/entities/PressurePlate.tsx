"use client";

import React from "react";
import { motion } from "framer-motion";

interface PressurePlateProps {
  size: number;
  isDepressed?: boolean;
}

export const PressurePlate: React.FC<PressurePlateProps> = ({ size, isDepressed = false }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
      animate={{
        scale: isDepressed ? 0.94 : 1,
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Outer Floor Rim */}
      <circle
        cx="40"
        cy="40"
        r="34"
        fill={isDepressed ? "#A7F3D0" : "#E2E8F0"}
        stroke={isDepressed ? "#10B981" : "#CBD5E1"}
        strokeWidth="4"
      />

      {/* Inner Pressure Pad */}
      <circle
        cx="40"
        cy="40"
        r="24"
        fill={isDepressed ? "#34D399" : "#F8FAFC"}
        stroke={isDepressed ? "#059669" : "#94A3B8"}
        strokeWidth="3"
      />

      {/* Central Symbol / Target Ring */}
      <circle
        cx="40"
        cy="40"
        r="12"
        fill={isDepressed ? "#10B981" : "none"}
        stroke={isDepressed ? "#FFFFFF" : "#F97316"}
        strokeWidth="4"
      />

      {isDepressed && (
        <motion.circle
          cx="40"
          cy="40"
          r="6"
          fill="#FFFFFF"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.svg>
  );
};
