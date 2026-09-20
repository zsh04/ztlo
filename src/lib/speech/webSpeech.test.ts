import test from "node:test";
import assert from "node:assert/strict";
import {
  isSpeechSynthesisSupported,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeech,
  listenToChild,
} from "./webSpeech";

test("WebSpeech: Graceful degradation in headless/server environment without window", () => {
  // In pure Node.js runtime, typeof window is "undefined"
  assert.equal(isSpeechSynthesisSupported(), false);
  assert.equal(isSpeechRecognitionSupported(), false);

  let errorCaptured: unknown = null;
  speakText("Hello Zyra", {
    onError: (err) => {
      errorCaptured = err;
    },
  });

  assert.ok(errorCaptured instanceof Error, "Must report error gracefully via callback");
  assert.match((errorCaptured as Error).message, /SpeechSynthesis is not supported/i);

  // stopSpeech must not throw
  assert.doesNotThrow(() => {
    stopSpeech();
  });

  // listenToChild must report error and return a safe no-op cancel function
  let sttError: string | undefined;
  const cancel = listenToChild({
    onResult: () => {},
    onError: (err) => {
      sttError = err;
    },
  });

  assert.equal(typeof cancel, "function");
  assert.doesNotThrow(() => {
    cancel();
  });
  assert.match(sttError || "", /not supported/i);
});

test("WebSpeech: Mocked SpeechSynthesis configures child-friendly pitch and rate", () => {
  let spokenUtterance: any = null;
  let cancelCalled = false;

  const mockWindow: any = {
    speechSynthesis: {
      cancel: () => {
        cancelCalled = true;
      },
      speak: (u: any) => {
        spokenUtterance = u;
      },
      getVoices: () => [],
    },
  };

  (global as any).window = mockWindow;
  (global as any).SpeechSynthesisUtterance = class {
    public text: string;
    public rate: number = 1;
    public pitch: number = 1;
    public volume: number = 1;
    public voice: any = null;
    public onstart: (() => void) | null = null;
    public onend: (() => void) | null = null;
    public onerror: ((err: any) => void) | null = null;

    constructor(text: string) {
      this.text = text;
    }
  };

  try {
    assert.equal(isSpeechSynthesisSupported(), true);

    let started = false;
    speakText("Look at the glowing plate!", {
      onStart: () => {
        started = true;
      },
    });

    assert.equal(cancelCalled, true, "Must cancel any active speech before starting new utterance");
    assert.ok(spokenUtterance, "SpeechSynthesis.speak must be called");
    assert.equal(spokenUtterance.text, "Look at the glowing plate!");
    // Pediatric speech parameters: gentle pace (0.92) and uplifting pitch (1.2)
    assert.equal(spokenUtterance.rate, 0.92);
    assert.equal(spokenUtterance.pitch, 1.2);
    assert.equal(spokenUtterance.volume, 1.0);

    // Trigger start callback
    spokenUtterance.onstart?.();
    assert.equal(started, true);

    // Calling stopSpeech triggers window.speechSynthesis.cancel
    cancelCalled = false;
    stopSpeech();
    assert.equal(cancelCalled, true);
  } finally {
    delete (global as any).window;
    delete (global as any).SpeechSynthesisUtterance;
  }
});

test("WebSpeech: Mocked SpeechRecognition properly handles child transcript and cancel cleanup", () => {
  let startCalled = false;
  let abortCalled = false;
  let recognitionInstance: any = null;

  class MockRecognition {
    public lang = "";
    public continuous = true;
    public interimResults = true;
    public maxAlternatives = 0;
    public onstart: (() => void) | null = null;
    public onresult: ((evt: any) => void) | null = null;
    public onerror: ((evt: any) => void) | null = null;
    public onend: (() => void) | null = null;

    constructor() {
      recognitionInstance = this;
    }

    start() {
      startCalled = true;
      this.onstart?.();
    }

    abort() {
      abortCalled = true;
      this.onend?.();
    }

    stop() {
      this.onend?.();
    }
  }

  (global as any).window = {
    SpeechRecognition: MockRecognition,
  };

  try {
    assert.equal(isSpeechRecognitionSupported(), true);

    let receivedTranscript = "";
    let started = false;
    const cancel = listenToChild({
      onStart: () => {
        started = true;
      },
      onResult: (text) => {
        receivedTranscript = text;
      },
    });

    assert.equal(startCalled, true);
    assert.equal(started, true);
    assert.equal(recognitionInstance.lang, "en-US");
    assert.equal(recognitionInstance.continuous, false);

    // Simulate child saying "help me"
    recognitionInstance.onresult?.({
      results: [[{ transcript: "  why did the ice slide so far  " }]],
    });
    assert.equal(receivedTranscript, "why did the ice slide so far");

    // Cancel aborts recognition
    cancel();
    assert.equal(abortCalled, true);
  } finally {
    delete (global as any).window;
  }
});
