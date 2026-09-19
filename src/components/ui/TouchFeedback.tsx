"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TouchFeedbackEvent } from "../../types/game";

interface TouchFeedbackProps {
  events: TouchFeedbackEvent[];
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({ events }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {events.map((evt) => (
          <motion.div
            key={evt.id}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: evt.screenX - 32,
              top: evt.screenY - 32,
              width: 64,
              height: 64,
            }}
            className="rounded-full border-4 border-storybook-interactable bg-storybook-interactable-soft/30"
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
