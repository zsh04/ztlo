/**
 * Project ZTLO - Procedural Web Audio Synthesizer
 * Zero external audio downloads.
 * Pure Web Audio API procedural synthesis optimized for pediatric acoustics:
 * warm, non-startling, tactile sound design.
 */

export interface SoundFxOptions {
  volume?: number;
  muted?: boolean;
}

export class SoundFxManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor(options?: SoundFxOptions) {
    if (options?.muted !== undefined) {
      this.muted = options.muted;
    }
    if (options?.volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, options.volume));
    }
  }

  /**
   * Lazily initialize or retrieve the AudioContext.
   * Gracefully degrades in server/headless environments.
   */
  public getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") {
      return null;
    }

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime
      );
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Gentle Step: Soft, subtle tap for Zyra's footstep on stone tiles.
   */
  public playStep(): void {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || this.muted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Gentle subtle tap: 200Hz dropping to 80Hz in 60ms
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio operation error safe catch
    }
  }

  /**
   * Heavy Stone Thud: Deep resonant low-frequency impact when pushing a stone block.
   */
  public playStonePush(): void {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || this.muted) return;

    try {
      const now = ctx.currentTime;

      // Low frequency sub-bass sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio operation error safe catch
    }
  }

  /**
   * Ice Slide Chime: Bright, crystalline shimmer when an ice block glides.
   */
  public playIceSlide(): void {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || this.muted) return;

    try {
      const now = ctx.currentTime;
      const fundamental = 880; // A5
      const harmonic = 1320; // E6

      [fundamental, harmonic].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        const delay = idx * 0.04;
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + delay + 0.22);

        gain.gain.setValueAtTime(0.15 * this.volume, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + delay);
        osc.stop(now + delay + 0.22);
      });
    } catch {
      // Audio operation error safe catch
    }
  }

  /**
   * Plate Click: Satisfying mechanical microswitch latch when a plate activates.
   */
  public playPlateClick(): void {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || this.muted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio operation error safe catch
    }
  }

  /**
   * Gate Opening Chord: Harmonious celestial chord (C5 - E5 - G5 - C6) when the door unseals.
   */
  public playGateOpen(): void {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain || this.muted) return;

    try {
      const now = ctx.currentTime;
      // Arpeggiated C major chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const chordNotes = [523.25, 659.25, 783.99, 1046.5];

      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        const noteStart = now + idx * 0.1;
        const noteDuration = 0.8 - idx * 0.08;

        osc.frequency.setValueAtTime(freq, noteStart);

        // Smooth swell and long gentle resonant decay
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.18 * this.volume, noteStart + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    } catch {
      // Audio operation error safe catch
    }
  }
}

// Global singleton instance for easy app-wide consumption
export const sfx = new SoundFxManager();

// Standalone function exports
export const playStepSound = () => sfx.playStep();
export const playStonePushSound = () => sfx.playStonePush();
export const playIceSlideSound = () => sfx.playIceSlide();
export const playPlateClickSound = () => sfx.playPlateClick();
export const playGateOpenSound = () => sfx.playGateOpen();
