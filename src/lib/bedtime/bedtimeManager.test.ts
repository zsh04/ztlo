import test from "node:test";
import assert from "node:assert/strict";

import {
  BedtimeManager,
  BEDTIME_PROMPT,
  BEDTIME_STORAGE_KEY,
  DEFAULT_TOTAL_DURATION_SECONDS,
  DEFAULT_TWILIGHT_DURATION_SECONDS,
} from "./bedtimeManager";

// Mock in-memory localStorage for Node test runner
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

test("BedtimeManager: initializes with default 15-min duration and daylight phase", () => {
  const manager = new BedtimeManager({ autoSave: false });
  const state = manager.getState();

  assert.equal(state.phase, "daylight");
  assert.equal(state.elapsedSeconds, 0);
  assert.equal(state.totalDurationSeconds, DEFAULT_TOTAL_DURATION_SECONDS); // 900s (15m)
  assert.equal(state.twilightDurationSeconds, DEFAULT_TWILIGHT_DURATION_SECONDS); // 720s (12m)
  assert.equal(state.remainingSeconds, 900);
  assert.equal(state.bedtimeReached, false);
});

test("BedtimeManager: transitions cleanly from daylight -> twilight -> bedtime", () => {
  const phaseChanges: string[] = [];
  const audioTriggers: string[] = [];

  const manager = new BedtimeManager({
    totalDurationSeconds: 10,
    twilightDurationSeconds: 6,
    autoSave: false,
    onPhaseChange: (newP, oldP) => phaseChanges.push(`${oldP}->${newP}`),
    onAudioTrigger: (type) => audioTriggers.push(type),
  });

  // T = 0 -> daylight
  assert.equal(manager.getState().phase, "daylight");

  // Advance to 5s -> still daylight
  manager.tick(5);
  assert.equal(manager.getState().phase, "daylight");

  // Advance to 6s -> twilight threshold
  manager.tick(1);
  assert.equal(manager.getState().phase, "twilight");
  assert.ok(audioTriggers.includes("twilight"), "Should trigger twilight chime");

  // Advance to 9s -> still twilight
  manager.tick(3);
  assert.equal(manager.getState().phase, "twilight");

  // Advance to 10s -> bedtime threshold
  manager.tick(1);
  assert.equal(manager.getState().phase, "bedtime");
  assert.equal(manager.getState().bedtimeReached, true);
  assert.ok(audioTriggers.includes("bedtime"), "Should trigger bedtime chime");

  assert.deepEqual(phaseChanges, ["daylight->twilight", "twilight->bedtime"]);
});

test("BedtimeManager: persists session state in localStorage and reloads seamlessly", () => {
  const mockStorage = new MockLocalStorage();
  const originalWindow = (globalThis as unknown as { window: unknown }).window;

  try {
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
    };

    // Manager 1 plays for 400 seconds
    const manager1 = new BedtimeManager({
      totalDurationSeconds: 900,
      twilightDurationSeconds: 720,
      autoSave: true,
    });
    manager1.tick(400);

    // Verify localStorage has entry
    const saved = mockStorage.getItem(BEDTIME_STORAGE_KEY);
    assert.ok(saved, "Storage key must be present");

    // Manager 2 instantiates and resumes state
    const manager2 = new BedtimeManager({
      totalDurationSeconds: 900,
      twilightDurationSeconds: 720,
      autoSave: true,
    });

    const restored = manager2.getState();
    assert.equal(restored.elapsedSeconds, 400);
    assert.equal(restored.phase, "daylight");
    assert.equal(restored.remainingSeconds, 500);

    // Further play advances into twilight
    manager2.tick(350); // total 750s
    assert.equal(manager2.getState().phase, "twilight");
  } finally {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  }
});

test("BedtimeManager: parental extension adds playtime and restores non-bedtime state", () => {
  const manager = new BedtimeManager({
    totalDurationSeconds: 900,
    twilightDurationSeconds: 720,
    autoSave: false,
  });

  // Reach bedtime
  manager.tick(900);
  assert.equal(manager.getState().phase, "bedtime");
  assert.equal(manager.getState().bedtimeReached, true);

  // Parent extends by 300s (5 minutes)
  manager.extendSession(300);
  const state = manager.getState();

  assert.equal(state.totalDurationSeconds, 1200); // 900 + 300
  assert.equal(state.phase, "twilight"); // 900s is between 720s and 1200s
  assert.equal(state.bedtimeReached, false);
  assert.equal(state.remainingSeconds, 300);
});

test("BedtimeManager: resetSession clears active elapsed time while preserving total playtime", () => {
  const manager = new BedtimeManager({
    totalDurationSeconds: 900,
    twilightDurationSeconds: 720,
    autoSave: false,
  });

  manager.tick(800);
  assert.equal(manager.getState().elapsedSeconds, 800);
  assert.equal(manager.getState().totalPlaytimeSeconds, 800);

  manager.resetSession();
  const state = manager.getState();

  assert.equal(state.elapsedSeconds, 0);
  assert.equal(state.phase, "daylight");
  assert.equal(state.totalPlaytimeSeconds, 800, "Total lifetime playtime preserved");
});

test("BedtimeManager: pause and resume prevent playtime increment during inactive periods", () => {
  const manager = new BedtimeManager({ autoSave: false });

  manager.tick(10);
  assert.equal(manager.getState().elapsedSeconds, 10);

  manager.pause();
  manager.tick(10); // should be ignored while paused
  assert.equal(manager.getState().elapsedSeconds, 10);

  manager.resume();
  manager.tick(5);
  assert.equal(manager.getState().elapsedSeconds, 15);
});

test("Pediatric Socratic Prompt: exact soothing off-ramp copy", () => {
  assert.ok(
    BEDTIME_PROMPT.includes("The stars are waking up"),
    "Prompt begins with gentle cosmic metaphor"
  );
  assert.ok(
    BEDTIME_PROMPT.includes("forest spirits are getting sleepy"),
    "Prompt references empathetic forest spirits"
  );
  assert.ok(
    BEDTIME_PROMPT.includes("cozy place to rest"),
    "Prompt encourages restful sleep without authoritarian commands"
  );
});
