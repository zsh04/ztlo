"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TouchFeedbackEvent } from "../../types/game";

interface TouchFeedbackProps {
  events: TouchFeedbackEvent[];
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({ events }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {events.map((evt) => (
          <div
            key={evt.id}
            style={{
              position: "absolute",
              left: evt.screenX,
              top: evt.screenY,
            }}
          >
            {/* Outer expanding ripple ring */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.85 }}
              animate={{ scale: 1.7, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: -40,
                top: -40,
                width: 80,
                height: 80,
              }}
              className="rounded-full border-2 border-storybook-interactable bg-storybook-interactable-soft/35 shadow-md shadow-storybook-interactable/25"
            />
            {/* Inner radiant focal pulse */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0.9 }}
              animate={{ scale: 0.9, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: -14,
                top: -14,
                width: 28,
                height: 28,
              }}
              className="rounded-full bg-storybook-interactable shadow-sm"
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
