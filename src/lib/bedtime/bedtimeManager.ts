/**
 * Project ZTLO - Bedtime Twilight Transition & Gentle Screen-time Off-ramp
 * Manages 15-minute pediatric play sessions with a 12-minute ambient twilight transition.
 * Honors pediatric sleep hygiene, zero punishing locks, and Socratic co-regulation.
 */

export type BedtimePhase = "daylight" | "twilight" | "bedtime";

export interface BedtimeState {
  phase: BedtimePhase;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  twilightDurationSeconds: number;
  remainingSeconds: number;
  bedtimeReached: boolean;
  isPaused: boolean;
  totalPlaytimeSeconds: number;
}

export interface BedtimePersistedData {
  sessionStartTime: number;
  elapsedSeconds: number;
  totalPlaytimeSeconds: number;
  bedtimeReached: boolean;
  lastActiveTimestamp: number;
  totalDurationSeconds: number;
  twilightDurationSeconds: number;
}

export const BEDTIME_STORAGE_KEY = "ztlo_bedtime_state";
export const DEFAULT_TOTAL_DURATION_SECONDS = 15 * 60; // 900 seconds (15 minutes)
export const DEFAULT_TWILIGHT_DURATION_SECONDS = 12 * 60; // 720 seconds (12 minutes)
export const PARENTAL_EXTENSION_SECONDS = 5 * 60; // 300 seconds (5 minutes)

export const BEDTIME_PROMPT =
  "The stars are waking up, and the forest spirits are getting sleepy... Let's find a cozy place to rest.";

export interface BedtimeManagerOptions {
  totalDurationSeconds?: number;
  twilightDurationSeconds?: number;
  onPhaseChange?: (newPhase: BedtimePhase, previousPhase: BedtimePhase) => void;
  onBedtimeReached?: () => void;
  onAudioTrigger?: (type: "twilight" | "bedtime") => void;
  autoSave?: boolean;
}

export class BedtimeManager {
  private totalDurationSeconds: number;
  private twilightDurationSeconds: number;
  private elapsedSeconds: number = 0;
  private totalPlaytimeSeconds: number = 0;
  private bedtimeReached: boolean = false;
  private isPaused: boolean = false;
  private currentPhase: BedtimePhase = "daylight";
  private listeners: Set<(state: BedtimeState) => void> = new Set();

  private onPhaseChange?: (newPhase: BedtimePhase, previousPhase: BedtimePhase) => void;
  private onBedtimeReached?: () => void;
  private onAudioTrigger?: (type: "twilight" | "bedtime") => void;
  private autoSave: boolean = true;

  constructor(options?: BedtimeManagerOptions) {
    this.totalDurationSeconds = options?.totalDurationSeconds ?? DEFAULT_TOTAL_DURATION_SECONDS;
    this.twilightDurationSeconds = options?.twilightDurationSeconds ?? DEFAULT_TWILIGHT_DURATION_SECONDS;
    this.onPhaseChange = options?.onPhaseChange;
    this.onBedtimeReached = options?.onBedtimeReached;
    this.onAudioTrigger = options?.onAudioTrigger;
    this.autoSave = options?.autoSave ?? true;

    this.loadState();
    this.recomputePhase(false);
  }

  public getState(): BedtimeState {
    const remaining = Math.max(0, this.totalDurationSeconds - this.elapsedSeconds);
    return {
      phase: this.currentPhase,
      elapsedSeconds: this.elapsedSeconds,
      totalDurationSeconds: this.totalDurationSeconds,
      twilightDurationSeconds: this.twilightDurationSeconds,
      remainingSeconds: remaining,
      bedtimeReached: this.bedtimeReached,
      isPaused: this.isPaused,
      totalPlaytimeSeconds: this.totalPlaytimeSeconds,
    };
  }

  public subscribe(listener: (state: BedtimeState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("[BedtimeManager] Listener error:", err);
      }
    });
  }

  public tick(deltaSeconds: number = 1): void {
    if (this.isPaused) return;

    this.elapsedSeconds += deltaSeconds;
    this.totalPlaytimeSeconds += deltaSeconds;

    this.recomputePhase(true);

    if (this.autoSave) {
      this.saveState();
    }

    this.notify();
  }

  private recomputePhase(triggerCallbacks: boolean): void {
    const prevPhase = this.currentPhase;
    let nextPhase: BedtimePhase = "daylight";

    if (this.elapsedSeconds >= this.totalDurationSeconds) {
      nextPhase = "bedtime";
    } else if (this.elapsedSeconds >= this.twilightDurationSeconds) {
      nextPhase = "twilight";
    }

    this.currentPhase = nextPhase;

    if (nextPhase === "bedtime" && !this.bedtimeReached) {
      this.bedtimeReached = true;
      if (triggerCallbacks) {
        this.onBedtimeReached?.();
        this.onAudioTrigger?.("bedtime");
      }
    }

    if (triggerCallbacks && prevPhase !== nextPhase) {
      if (nextPhase === "twilight" && prevPhase === "daylight") {
        this.onAudioTrigger?.("twilight");
      }
      this.onPhaseChange?.(nextPhase, prevPhase);
    }
  }

  /**
   * Parental extension: add extra calming playtime (e.g. +5 minutes).
   */
  public extendSession(additionalSeconds: number = PARENTAL_EXTENSION_SECONDS): void {
    this.totalDurationSeconds += additionalSeconds;
    this.bedtimeReached = false;
    this.recomputePhase(true);
    if (this.autoSave) {
      this.saveState();
    }
    this.notify();
  }

  /**
   * Resets active session counter for a fresh playtime block while preserving lifetime stats.
   */
  public resetSession(): void {
    this.elapsedSeconds = 0;
    this.bedtimeReached = false;
    this.isPaused = false;
    this.recomputePhase(true);
    if (this.autoSave) {
      this.saveState();
    }
    this.notify();
  }

  public pause(): void {
    this.isPaused = true;
    this.notify();
  }

  public resume(): void {
    this.isPaused = false;
    this.notify();
  }

  public setDurations(totalSeconds: number, twilightSeconds: number): void {
    this.totalDurationSeconds = Math.max(10, totalSeconds);
    this.twilightDurationSeconds = Math.max(5, Math.min(twilightSeconds, this.totalDurationSeconds));
    this.recomputePhase(true);
    if (this.autoSave) {
      this.saveState();
    }
    this.notify();
  }

  public saveState(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const data: BedtimePersistedData = {
        sessionStartTime: Date.now() - this.elapsedSeconds * 1000,
        elapsedSeconds: this.elapsedSeconds,
        totalPlaytimeSeconds: this.totalPlaytimeSeconds,
        bedtimeReached: this.bedtimeReached,
        lastActiveTimestamp: Date.now(),
        totalDurationSeconds: this.totalDurationSeconds,
        twilightDurationSeconds: this.twilightDurationSeconds,
      };
      window.localStorage.setItem(BEDTIME_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable or quota safe catch
    }
  }

  public loadState(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(BEDTIME_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as BedtimePersistedData;

      if (typeof data.elapsedSeconds === "number" && data.elapsedSeconds >= 0) {
        this.elapsedSeconds = data.elapsedSeconds;
      }
      if (typeof data.totalPlaytimeSeconds === "number" && data.totalPlaytimeSeconds >= 0) {
        this.totalPlaytimeSeconds = data.totalPlaytimeSeconds;
      }
      if (typeof data.bedtimeReached === "boolean") {
        this.bedtimeReached = data.bedtimeReached;
      }
      if (typeof data.totalDurationSeconds === "number" && data.totalDurationSeconds > 0) {
        this.totalDurationSeconds = data.totalDurationSeconds;
      }
      if (typeof data.twilightDurationSeconds === "number" && data.twilightDurationSeconds > 0) {
        this.twilightDurationSeconds = data.twilightDurationSeconds;
      }
    } catch {
      // JSON parse error safe catch
    }
  }

  public clearStorage(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.removeItem(BEDTIME_STORAGE_KEY);
    } catch {
      // Storage safe catch
    }
  }
}
