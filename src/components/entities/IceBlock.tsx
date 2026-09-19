"use client";

import React from "react";
import { motion } from "framer-motion";

interface IceBlockProps {
  size: number;
}

export const IceBlock: React.FC<IceBlockProps> = ({ size }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
      animate={{ opacity: [0.92, 1, 0.92] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Base Drop Shadow */}
      <rect x="6" y="10" width="68" height="66" rx="12" fill="#0284C7" fillOpacity="0.25" />

      {/* Main Ice Crystal Body */}
      <rect x="6" y="6" width="68" height="66" rx="12" fill="#38BDF8" fillOpacity="0.85" />

      {/* Surface Gloss / Glint */}
      <path
        d="M12 12L42 12L24 50L12 50Z"
        fill="#FFFFFF"
        fillOpacity="0.45"
      />

      {/* Inner Snowflake / Frictionless Rune */}
      <circle cx="40" cy="39" r="14" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3 3" />
      <path
        d="M40 29V49M30 39H50M33 32L47 46M33 46L47 32"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};
