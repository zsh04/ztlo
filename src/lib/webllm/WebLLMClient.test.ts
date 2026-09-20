import test from "node:test";
import assert from "node:assert/strict";
import { WebLLMClient } from "./WebLLMClient";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL_ID,
  DEFAULT_TEMPERATURE,
  SOCRATIC_SYSTEM_PROMPT,
  buildUserPrompt,
  DownloadProgress,
} from "./types";
import {
  createPlayerEntity,
  createStoneBlockEntity,
  createPressurePlateEntity,
  createDoorEntity,
  createIceBlockEntity,
} from "../../ecs/entities";

/**
 * Mock Web Worker simulating the background WebLLM thread.
 */
class MockWorker {
  public postMessageCalls: any[] = [];
  public isTerminated = false;
  private listeners: Record<string, Function[]> = {};

  addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
  }

  postMessage(message: any) {
    this.postMessageCalls.push(message);
  }

  emitMessage(data: any) {
    const event = { data } as MessageEvent;
    const handlers = [...(this.listeners["message"] || [])];
    for (const h of handlers) {
      h(event);
    }
  }

  emitError(error: any) {
    const handlers = [...(this.listeners["error"] || [])];
    for (const h of handlers) {
      h(error);
    }
  }

  terminate() {
    this.isTerminated = true;
    this.listeners = {};
  }
}

/**
 * Helper to simulate WebGPU support in navigator.
 */
function mockWebGPU(supported: boolean): () => void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, "gpu");

  if (supported) {
    Object.defineProperty(globalThis.navigator, "gpu", {
      value: {
        requestAdapter: async () => ({
          requestDevice: async () => ({}),
        }),
      },
      configurable: true,
      writable: true,
    });
  } else {
    try {
      delete (globalThis.navigator as any).gpu;
    } catch {
      Object.defineProperty(globalThis.navigator, "gpu", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  }

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis.navigator, "gpu", originalDescriptor);
    } else {
      delete (globalThis.navigator as any).gpu;
    }
  };
}

const sleep = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

test("WebLLM Constants & Prompt Scaffolding: strict pediatric constraints", () => {
  assert.equal(DEFAULT_MODEL_ID, "SmolLM2-360M-Instruct-q4f16_1-MLC");
  assert.equal(DEFAULT_TEMPERATURE, 0.3);
  assert.equal(DEFAULT_MAX_TOKENS, 35);
  assert.equal(
    SOCRATIC_SYSTEM_PROMPT,
    "You are the Light Orb, a gentle, friendly companion for a 6-year-old explorer named Zyra. You never give direct orders or spoil answers. You ask curious, gentle scaffolding questions under 20 words to guide her thinking."
  );

  const words = SOCRATIC_SYSTEM_PROMPT.split(/\s+/);
  assert.ok(words.length <= 40, "System prompt should be concise and well bounded");
});

test("buildUserPrompt: formats context and queries appropriately", () => {
  const prompt = buildUserPrompt(
    {
      roomId: "shrine-01",
      roomName: "Shrine of Still Weight",
      objective: "Push the heavy stone block onto the round pressure plate",
      interactables: ["stone-1", "plate-1"],
    },
    "What do I do with the stone?"
  );

  assert.ok(prompt.includes("Shrine of Still Weight"));
  assert.ok(prompt.includes("Push the heavy stone"));
  assert.ok(prompt.includes("stone-1, plate-1"));
  assert.ok(prompt.includes('Zyra asks: "What do I do with the stone?"'));
});

test("WebLLMClient Lifecycle & Protocol: INIT -> INIT_PROGRESS -> READY -> GENERATE_HINT", async () => {
  const restoreGPU = mockWebGPU(true);
  try {
    const mockWorker = new MockWorker();
    const progressReports: DownloadProgress[] = [];

    const client = new WebLLMClient({
      worker: mockWorker as unknown as Worker,
      onProgress: (p) => progressReports.push(p),
    });

    assert.equal(client.getStatus(), "uninitialized");

    // Start initialization
    const initPromise = client.init();
    assert.equal(client.getStatus(), "loading");

    // Await microtask for WebGPU check to dispatch INIT
    await sleep(15);

    // Verify INIT message was dispatched to worker
    assert.equal(mockWorker.postMessageCalls.length, 1);
    assert.deepEqual(mockWorker.postMessageCalls[0], {
      type: "INIT",
      modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    });

    // Simulate worker sending download progress updates
    mockWorker.emitMessage({
      type: "INIT_PROGRESS",
      progress: 0.25,
      percentage: 25,
      text: "Downloading model weights [25%]...",
    });
    mockWorker.emitMessage({
      type: "INIT_PROGRESS",
      progress: 0.75,
      percentage: 75,
      text: "Downloading model weights [75%]...",
    });

    assert.equal(progressReports.length, 2);
    assert.equal(progressReports[0].percentage, 25);
    assert.equal(progressReports[1].percentage, 75);
    assert.equal(client.getProgress()?.percentage, 75);

    // Simulate worker signaling READY
    mockWorker.emitMessage({
      type: "READY",
      modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    });

    await initPromise;
    assert.equal(client.getStatus(), "ready");
    assert.equal(client.isReady(), true);
    assert.equal(client.isFallback(), false);

    // Request hint generation
    const hintPromise = client.generateHint({
      roomId: "shrine-01",
      objective: "Push stone to plate",
    });

    // Check message sent to worker
    assert.equal(mockWorker.postMessageCalls.length, 2);
    const generateMsg = mockWorker.postMessageCalls[1];
    assert.equal(generateMsg.type, "GENERATE_HINT");
    assert.equal(generateMsg.temperature, 0.3);
    assert.equal(generateMsg.maxTokens, 35);
    assert.ok(generateMsg.id.startsWith("hint-"));

    // Simulate worker responding with hint
    mockWorker.emitMessage({
      type: "HINT_RESULT",
      id: generateMsg.id,
      hint: "I wonder what would happen if that round stone slid towards the glow?",
    });

    const hint = await hintPromise;
    assert.equal(
      hint,
      "I wonder what would happen if that round stone slid towards the glow?"
    );

    // Clean up
    client.terminate();
    assert.equal(mockWorker.isTerminated, true);
    assert.equal(client.getStatus(), "uninitialized");
  } finally {
    restoreGPU();
  }
});

test("Automatic Fallback: WebGPU unsupported triggers MentorSystem fallback", async () => {
  const restoreGPU = mockWebGPU(false);
  try {
    const mockWorker = new MockWorker();
    const client = new WebLLMClient({
      worker: mockWorker as unknown as Worker,
    });

    // Init without WebGPU
    await client.init();
    assert.equal(client.getStatus(), "fallback");
    assert.equal(client.isFallback(), true);
    assert.equal(client.isReady(), false);

    // Entities in room with unpressed plate and stone block
    const player = createPlayerEntity("player-1", 1, 1);
    const stone = createStoneBlockEntity("stone-1", 3, 1);
    const plate = createPressurePlateEntity("plate-1", 5, 1, "door-1");
    const door = createDoorEntity("door-1", 6, 1);

    const fallbackHint = await client.generateHint({
      entities: [player, stone, plate, door],
    });

    // Assert MentorSystem deterministic dialogue was returned
    assert.ok(typeof fallbackHint === "string");
    assert.ok(
      fallbackHint.includes("heavy") || fallbackHint.includes("switch") || fallbackHint.includes("stone"),
      `Expected Socratic mentor hint, got: ${fallbackHint}`
    );

    // Ensure worker was never sent a GENERATE_HINT message
    const generateCalls = mockWorker.postMessageCalls.filter(
      (m) => m.type === "GENERATE_HINT"
    );
    assert.equal(generateCalls.length, 0);

    client.terminate();
  } finally {
    restoreGPU();
  }
});

test("Automatic Fallback: Worker INIT error transitions to MentorSystem fallback", async () => {
  const restoreGPU = mockWebGPU(true);
  try {
    const mockWorker = new MockWorker();
    const client = new WebLLMClient({
      worker: mockWorker as unknown as Worker,
    });

    const initPromise = client.init();
    assert.equal(client.getStatus(), "loading");

    await sleep(15);

    // Worker emits error
    mockWorker.emitMessage({
      type: "ERROR",
      code: "INIT_FAILED",
      error: "Out of memory / Jetsam simulation",
    });

    await initPromise;
    assert.equal(client.getStatus(), "fallback");
    assert.equal(client.isFallback(), true);

    // Generate hint should transparently succeed via MentorSystem
    const player = createPlayerEntity("player-1", 1, 1);
    const ice = createIceBlockEntity("ice-1", 3, 1);
    const plate = createPressurePlateEntity("plate-1", 5, 1, "door-1");
    const door = createDoorEntity("door-1", 6, 1);

    const hint = await client.generateHint({
      entities: [player, ice, plate, door],
    });

    assert.ok(hint.includes("Ice") || hint.includes("glide") || hint.includes("friction"));

    client.terminate();
  } finally {
    restoreGPU();
  }
});

test("Automatic Fallback: Inference error falls back to MentorSystem", async () => {
  const restoreGPU = mockWebGPU(true);
  try {
    const mockWorker = new MockWorker();
    const client = new WebLLMClient({
      worker: mockWorker as unknown as Worker,
    });

    const initPromise = client.init();
    await sleep(15);

    mockWorker.emitMessage({
      type: "READY",
      modelId: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    });
    await initPromise;

    const player = createPlayerEntity("player-1", 1, 1);
    const stone = createStoneBlockEntity("stone-1", 3, 1);
    const plate = createPressurePlateEntity("plate-1", 5, 1, "door-1");

    const hintPromise = client.generateHint({
      entities: [player, stone, plate],
    });

    const generateMsg = mockWorker.postMessageCalls.find((m) => m.type === "GENERATE_HINT");
    assert.ok(generateMsg);

    // Simulate worker error during generation
    mockWorker.emitMessage({
      type: "ERROR",
      code: "INFERENCE_FAILED",
      id: generateMsg.id,
      error: "GPU pipeline aborted",
    });

    const hint = await hintPromise;
    // Should gracefully return fallback hint instead of throwing
    assert.ok(typeof hint === "string");
    assert.ok(hint.length > 0);

    client.terminate();
  } finally {
    restoreGPU();
  }
});
