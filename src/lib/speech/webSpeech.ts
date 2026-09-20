/**
 * Web Speech API wrapper for Project ZTLO (Zyra & The Light Orb)
 * Provides 0-dependency, 0 MB bundle size, native browser TTS and STT
 * optimized for iPad Safari and modern WebKit/Chromium browsers.
 */

// Retain active utterance in memory to prevent premature garbage collection in WebKit/iOS Safari
let activeUtterance: SpeechSynthesisUtterance | null = null;

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Checks if SpeechSynthesis TTS is available in the current environment.
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Checks if SpeechRecognition STT is available in the current environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in (window as unknown as { webkitSpeechRecognition?: unknown })
  );
}

/**
 * Speaks text aloud using native Web Speech Synthesis.
 * Friendly, warm, slightly higher pitch suitable for a 6-year-old child companion.
 */
export function speakText(text: string, options?: SpeakOptions): void {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.(new Error("SpeechSynthesis is not supported on this device"));
    return;
  }

  try {
    // Cancel any currently playing speech to prevent queuing overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    utterance.rate = options?.rate ?? 0.92; // Gentle, clear pacing for pediatric comprehension
    utterance.pitch = options?.pitch ?? 1.2; // Friendly, uplifting companion tone
    utterance.volume = options?.volume ?? 1.0;

    // Pick a high quality English voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Samantha") ||
              v.name.includes("Victoria") ||
              v.name.includes("Karen") ||
              v.name.includes("Natural") ||
              v.name.includes("Female"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      options?.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    activeUtterance = null;
    options?.onError?.(err);
  }
}

/**
 * Stops all currently active speech synthesis immediately.
 */
export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancellation errors
    }
    activeUtterance = null;
  }
}

export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

interface WebKitSpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface WebKitSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: WebKitSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => WebKitSpeechRecognitionInstance;

/**
 * Starts listening to child speech via native SpeechRecognition / webkitSpeechRecognition.
 * Returns an abort / stop function to cleanly cancel active listening.
 */
export function listenToChild(handlers: SpeechRecognitionResultHandler): () => void {
  if (!isSpeechRecognitionSupported()) {
    handlers.onError?.("Speech recognition not supported in this browser");
    return () => {};
  }

  try {
    const globalWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const RecognitionClass =
      globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;

    if (!RecognitionClass) {
      handlers.onError?.("Speech recognition constructor unavailable");
      return () => {};
    }

    const recognition = new RecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      handlers.onStart?.();
    };

    recognition.onresult = (event: WebKitSpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        handlers.onResult(transcript.trim());
      }
    };

    recognition.onerror = (event: { error: string }) => {
      handlers.onError?.(event.error);
    };

    recognition.onend = () => {
      handlers.onEnd?.();
    };

    recognition.start();

    return () => {
      try {
        recognition.abort();
      } catch {
        // Ignore abort errors
      }
    };
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err.message : String(err));
    return () => {};
  }
}
