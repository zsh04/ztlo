"use client";

import { useEffect, useState, useRef } from "react";
import {
  BedtimeManager,
  BedtimeState,
  BedtimeManagerOptions,
} from "./bedtimeManager";
import { sfx } from "../audio/sfx";

export interface UseBedtimeOptions extends BedtimeManagerOptions {
  enabled?: boolean;
}

export function useBedtime(options?: UseBedtimeOptions) {
  const enabled = options?.enabled ?? true;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [manager] = useState(() => {
    return new BedtimeManager({
      ...optionsRef.current,
      onAudioTrigger: (type) => {
        optionsRef.current?.onAudioTrigger?.(type);
        sfx.synthesizeNightChime();
      },
      onPhaseChange: (newPhase, prevPhase) => {
        optionsRef.current?.onPhaseChange?.(newPhase, prevPhase);
      },
      onBedtimeReached: () => {
        optionsRef.current?.onBedtimeReached?.();
      },
    });
  });

  const [state, setState] = useState<BedtimeState>(() => manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      manager.tick(1);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, manager]);

  return {
    state,
    extendSession: (seconds?: number) => manager.extendSession(seconds),
    resetSession: () => manager.resetSession(),
    pause: () => manager.pause(),
    resume: () => manager.resume(),
    manager,
  };
}
