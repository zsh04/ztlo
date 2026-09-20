import { Entity } from "../../ecs/entities";

/**
 * Strict Socratic system prompt enforced across all WebLLM inference tasks.
 * Complies with Project ZTLO pediatric scaffolding and zero-spoil pedagogical standards.
 */
export const SOCRATIC_SYSTEM_PROMPT =
  "You are the Light Orb, a gentle, friendly companion for a 6-year-old explorer named Zyra. You never give direct orders or spoil answers. You ask curious, gentle scaffolding questions under 20 words to guide her thinking.";

/**
 * Default quantized model target: SmolLM2-360M-Instruct-q4f16_1-MLC.
 * ~140MB initial download, ~380MB runtime VRAM footprint.
 * Strictly within iPadOS 1.2GB jetsam watchdog threshold.
 */
export const DEFAULT_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";

/**
 * Enforced generation parameters.
 */
export const DEFAULT_TEMPERATURE = 0.3;
export const DEFAULT_MAX_TOKENS = 35;

export type WebLLMStatus =
  | "uninitialized"
  | "loading"
  | "ready"
  | "fallback"
  | "error";

export interface DownloadProgress {
  progress: number;   // 0.0 to 1.0
  percentage: number; // 0 to 100
  text: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export interface HintContext {
  roomId?: string;
  roomName?: string;
  objective?: string;
  interactables?: string[];
  playerInventory?: string[];
  lastAction?: string;
  entities?: Entity[];
  userQuery?: string;
  roomState?: string;
}

// ==========================================
// Structured Worker Message Protocol Types
// ==========================================

export type WorkerMessageType =
  | "INIT"
  | "INIT_PROGRESS"
  | "GENERATE_HINT"
  | "READY"
  | "ERROR"
  | "HINT_RESULT";

// Messages sent from Main Thread (Client) -> Web Worker
export interface WorkerInitMessage {
  type: "INIT";
  modelId?: string;
  appConfig?: Record<string, unknown>;
}

export interface WorkerGenerateHintMessage {
  type: "GENERATE_HINT";
  id: string;
  prompt?: string;
  context?: HintContext;
  userQuery?: string;
  temperature?: number;
  maxTokens?: number;
}

export type ClientToWorkerMessage =
  | WorkerInitMessage
  | WorkerGenerateHintMessage;

// Messages sent from Web Worker -> Main Thread (Client)
export interface WorkerInitProgressMessage {
  type: "INIT_PROGRESS";
  progress: number;
  percentage: number;
  text: string;
}

export interface WorkerReadyMessage {
  type: "READY";
  modelId: string;
}

export interface WorkerHintResultMessage {
  type: "HINT_RESULT" | "GENERATE_HINT";
  id: string;
  hint: string;
}

export interface WorkerErrorMessage {
  type: "ERROR";
  error: string;
  code?: "WEBGPU_UNAVAILABLE" | "INIT_FAILED" | "INFERENCE_FAILED" | "NOT_INITIALIZED" | string;
  id?: string;
}

export type WorkerToClientMessage =
  | WorkerInitProgressMessage
  | WorkerReadyMessage
  | WorkerHintResultMessage
  | WorkerErrorMessage;

/**
 * Checks if WebGPU is available in the current execution environment.
 */
export async function isWebGPUSupported(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("gpu" in navigator) || !(navigator as any).gpu) {
    return false;
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Formats contextual room details and player status into a concise prompt for the companion.
 */
export function buildUserPrompt(context?: HintContext, userQuery?: string): string {
  if (userQuery && !context) {
    return userQuery;
  }

  const parts: string[] = [];

  if (context?.roomName) {
    parts.push(`Room: ${context.roomName}`);
  } else if (context?.roomId) {
    parts.push(`Room: ${context.roomId}`);
  }

  if (context?.objective) {
    parts.push(`Objective: ${context.objective}`);
  }

  if (context?.interactables && context.interactables.length > 0) {
    parts.push(`Visible items: ${context.interactables.join(", ")}`);
  }

  if (context?.playerInventory && context.playerInventory.length > 0) {
    parts.push(`Zyra holds: ${context.playerInventory.join(", ")}`);
  }

  if (context?.lastAction) {
    parts.push(`Recent event: ${context.lastAction}`);
  }

  if (context?.roomState) {
    parts.push(`Room State: ${context.roomState}`);
  }

  const contextStr = parts.length > 0 ? `[Context: ${parts.join(" | ")}] ` : "";

  if (userQuery) {
    return `${contextStr}Zyra asks: "${userQuery}"`;
  }

  return `${contextStr}Zyra paused to think. Ask a gentle question about what she notices.`;
}
