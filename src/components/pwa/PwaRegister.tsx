"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV !== "test"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Listen for SW updates
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New SW available; can prompt reload or skip waiting
                }
              });
            }
          });
        })
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[PWA] Service Worker registration failed:", error);
          }
        });
    }
  }, []);

  return null;
}
