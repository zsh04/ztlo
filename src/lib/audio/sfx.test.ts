import test from "node:test";
import assert from "node:assert/strict";

import {
  SoundFxManager,
  playStepSound,
  playStonePushSound,
  playIceSlideSound,
  playPlateClickSound,
  playGateOpenSound,
} from "./sfx";

test("SoundFxManager: graceful degradation in Node/headless environment without window", () => {
  const sfx = new SoundFxManager();
  assert.equal(sfx.getAudioContext(), null);

  // Calling methods in headless environment should never throw
  assert.doesNotThrow(() => {
    sfx.playStep();
    sfx.playStonePush();
    sfx.playIceSlide();
    sfx.playPlateClick();
    sfx.playGateOpen();
  });

  assert.doesNotThrow(() => {
    playStepSound();
    playStonePushSound();
    playIceSlideSound();
    playPlateClickSound();
    playGateOpenSound();
  });
});

test("SoundFxManager: volume and mute configuration state", () => {
  const sfx = new SoundFxManager({ volume: 0.8, muted: false });
  assert.equal(sfx.getVolume(), 0.8);
  assert.equal(sfx.isMuted(), false);

  sfx.setMuted(true);
  assert.equal(sfx.isMuted(), true);

  sfx.setVolume(1.5); // should clamp to 1.0
  assert.equal(sfx.getVolume(), 1.0);

  sfx.setVolume(-0.2); // should clamp to 0.0
  assert.equal(sfx.getVolume(), 0.0);
});

// Mocking Web Audio API for comprehensive synthesizer unit testing
class MockAudioParam {
  value: number = 0;
  setValueAtTime(_val: number, _time: number) {
    this.value = _val;
  }
  exponentialRampToValueAtTime(_val: number, _time: number) {
    this.value = _val;
  }
  linearRampToValueAtTime(_val: number, _time: number) {
    this.value = _val;
  }
}

class MockGainNode {
  gain = new MockAudioParam();
  connected: unknown[] = [];
  connect(target: unknown) {
    this.connected.push(target);
  }
}

class MockOscillatorNode {
  type: string = "sine";
  frequency = new MockAudioParam();
  connected: unknown[] = [];
  started: number | null = null;
  stopped: number | null = null;

  connect(target: unknown) {
    this.connected.push(target);
  }

  start(time: number) {
    this.started = time;
  }

  stop(time: number) {
    this.stopped = time;
  }
}

class MockAudioContext {
  currentTime = 10;
  state: AudioContextState = "suspended";
  destination = {};
  createdOscillators: MockOscillatorNode[] = [];
  createdGains: MockGainNode[] = [];
  resumed = false;

  async resume() {
    this.resumed = true;
    this.state = "running";
  }

  createGain() {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain as unknown as GainNode;
  }

  createOscillator() {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc as unknown as OscillatorNode;
  }
}

test("SoundFxManager with Mock AudioContext: synthesizes gentle step", () => {
  const mockCtx = new MockAudioContext();
  const originalWindow = (globalThis as unknown as { window: unknown }).window;

  try {
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: function () {
        return mockCtx;
      },
    };

    const sfx = new SoundFxManager({ volume: 0.5 });
    sfx.playStep();

    assert.equal(mockCtx.resumed, true, "Should automatically resume suspended context");
    assert.ok(mockCtx.createdOscillators.length >= 1, "Should create oscillator for step");
    assert.ok(mockCtx.createdGains.length >= 1, "Should create gain node for step");
    assert.equal(mockCtx.createdOscillators[0].type, "sine");
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
});

test("SoundFxManager with Mock AudioContext: synthesizes heavy stone thud", () => {
  const mockCtx = new MockAudioContext();
  const originalWindow = (globalThis as unknown as { window: unknown }).window;

  try {
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: function () {
        return mockCtx;
      },
    };

    const sfx = new SoundFxManager({ volume: 0.6 });
    sfx.playStonePush();

    const stoneOsc = mockCtx.createdOscillators[mockCtx.createdOscillators.length - 1];
    assert.ok(stoneOsc, "Should create oscillator for stone push");
    assert.equal(stoneOsc.type, "triangle", "Stone push uses warm triangle wave");
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
});

test("SoundFxManager with Mock AudioContext: synthesizes ice slide chime", () => {
  const mockCtx = new MockAudioContext();
  const originalWindow = (globalThis as unknown as { window: unknown }).window;

  try {
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: function () {
        return mockCtx;
      },
    };

    const sfx = new SoundFxManager({ volume: 0.5 });
    sfx.playIceSlide();

    // Ice chime creates 2 harmonic tones
    assert.ok(mockCtx.createdOscillators.length >= 2, "Ice slide creates harmonic oscillators");
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
});

test("SoundFxManager with Mock AudioContext: synthesizes plate click and gate chord", () => {
  const mockCtx = new MockAudioContext();
  const originalWindow = (globalThis as unknown as { window: unknown }).window;

  try {
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: function () {
        return mockCtx;
      },
    };

    const sfx = new SoundFxManager({ volume: 0.7 });
    sfx.playPlateClick();
    assert.ok(mockCtx.createdOscillators.length >= 1, "Plate click creates impulse oscillator");

    const oscCountBeforeGate = mockCtx.createdOscillators.length;
    sfx.playGateOpen();
    const chordNotesCreated = mockCtx.createdOscillators.length - oscCountBeforeGate;
    assert.equal(chordNotesCreated, 4, "Gate open creates 4 harmonic chord notes (C5, E5, G5, C6)");
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
});

test("SoundFxManager with Mock AudioContext: respects muted state", () => {
  const mockCtx = new MockAudioContext();
  const originalWindow = (globalThis as unknown as { window: unknown }).window;

  try {
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: function () {
        return mockCtx;
      },
    };

    const sfx = new SoundFxManager({ muted: true });
    // Initialize context
    sfx.getAudioContext();
    const oscCount = mockCtx.createdOscillators.length;

    sfx.playStep();
    sfx.playStonePush();
    sfx.playIceSlide();
    sfx.playPlateClick();
    sfx.playGateOpen();

    assert.equal(
      mockCtx.createdOscillators.length,
      oscCount,
      "Muted manager should not schedule sound oscillators"
    );
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
});
