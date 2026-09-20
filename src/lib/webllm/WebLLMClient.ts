import { MentorSystem } from "../../ecs/systems/MentorSystem";
import {
  ClientToWorkerMessage,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL_ID,
  DEFAULT_TEMPERATURE,
  DownloadProgress,
  HintContext,
  ProgressCallback,
  WebLLMStatus,
  WorkerErrorMessage,
  WorkerGenerateHintMessage,
  WorkerHintResultMessage,
  WorkerInitMessage,
  WorkerInitProgressMessage,
  WorkerReadyMessage,
  WorkerToClientMessage,
  isWebGPUSupported,
} from "./types";

export interface WebLLMClientOptions {
  modelId?: string;
  worker?: Worker;
  workerFactory?: () => Worker;
  onProgress?: ProgressCallback;
  autoInit?: boolean;
}

interface PendingRequest {
  resolve: (hint: string) => void;
  reject: (error: Error) => void;
}

/**
 * Client interface for interacting with WebLLM embedded inside a dedicated Web Worker.
 *
 * Guarantees:
 * 1. Zero main-thread blocking (preserves 60 FPS physics and rendering).
 * 2. Automatic transparent fallback to deterministic MentorSystem when WebGPU is missing or fails.
 * 3. Structured worker message communication protocol (INIT, INIT_PROGRESS, GENERATE_HINT, READY, ERROR).
 * 4. Observable download and weight caching progress callbacks.
 */
export class WebLLMClient {
  private worker: Worker | null = null;
  private workerFactory?: () => Worker;
  private status: WebLLMStatus = "uninitialized";
  private modelId: string;
  private lastProgress: DownloadProgress | null = null;
  private progressListeners: Set<ProgressCallback> = new Set();
  private statusListeners: Set<(status: WebLLMStatus) => void> = new Set();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private initPromise: Promise<void> | null = null;

  constructor(options: WebLLMClientOptions = {}) {
    this.modelId = options.modelId || DEFAULT_MODEL_ID;
    this.worker = options.worker || null;
    this.workerFactory = options.workerFactory;

    if (options.onProgress) {
      this.progressListeners.add(options.onProgress);
    }

    if (this.worker) {
      this.attachWorkerListeners(this.worker);
    }

    if (options.autoInit) {
      this.init().catch((err) => {
        console.warn("[WebLLMClient] Auto-initialization encountered error:", err);
      });
    }
  }

  /**
   * Current status of WebLLM engine.
   */
  public getStatus(): WebLLMStatus {
    return this.status;
  }

  public isReady(): boolean {
    return this.status === "ready";
  }

  public isFallback(): boolean {
    return this.status === "fallback";
  }

  public isLoading(): boolean {
    return this.status === "loading";
  }

  public getModelId(): string {
    return this.modelId;
  }

  public getProgress(): DownloadProgress | null {
    return this.lastProgress;
  }

  /**
   * Subscribe to model download and shader compilation progress events.
   */
  public onProgress(callback: ProgressCallback): () => void {
    this.progressListeners.add(callback);
    if (this.lastProgress) {
      callback(this.lastProgress);
    }
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  /**
   * Subscribe to state machine status transitions.
   */
  public onStatusChange(callback: (status: WebLLMStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Asynchronously initializes the Web Worker and loads the target model.
   * If WebGPU is unsupported or initialization encounters any error,
   * cleanly transitions to 'fallback' state without throwing.
   */
  public async init(options?: { modelId?: string; onProgress?: ProgressCallback }): Promise<void> {
    if (options?.modelId) {
      this.modelId = options.modelId;
    }
    if (options?.onProgress) {
      this.progressListeners.add(options.onProgress);
    }

    if (this.status === "ready") {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private async performInit(): Promise<void> {
    this.setStatus("loading");

    // 1. Hardware capability check: verify WebGPU support
    const hasWebGPU = await isWebGPUSupported();
    if (!hasWebGPU) {
      console.warn(
        "[WebLLMClient] WebGPU is not supported on this device/browser. Activating deterministic Socratic fallback."
      );
      this.setStatus("fallback");
      return;
    }

    // 2. Initialize worker instance
    if (!this.worker) {
      try {
        if (this.workerFactory) {
          this.worker = this.workerFactory();
        } else if (typeof window !== "undefined") {
          this.worker = new Worker(
            new URL("../../workers/webllm.worker.ts", import.meta.url),
            { type: "module" }
          );
        } else {
          // SSR or headless environment without explicit mock worker
          this.setStatus("fallback");
          return;
        }
        this.attachWorkerListeners(this.worker);
      } catch (err) {
        console.warn("[WebLLMClient] Failed to spawn Web Worker. Activating fallback.", err);
        this.setStatus("fallback");
        return;
      }
    }

    // 3. Dispatch INIT message to worker and await READY or ERROR
    return new Promise<void>((resolve) => {
      const handleReady = (event: MessageEvent<WorkerToClientMessage>) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === "READY") {
          this.worker?.removeEventListener("message", handleReady);
          this.setStatus("ready");
          resolve();
        } else if (msg.type === "ERROR" && (msg.code === "WEBGPU_UNAVAILABLE" || msg.code === "INIT_FAILED")) {
          this.worker?.removeEventListener("message", handleReady);
          console.warn("[WebLLMClient] Worker initialization failed. Activating fallback:", msg.error);
          this.setStatus("fallback");
          resolve();
        }
      };

      this.worker?.addEventListener("message", handleReady);

      const initMsg: WorkerInitMessage = {
        type: "INIT",
        modelId: this.modelId,
      };
      this.worker?.postMessage(initMsg);
    });
  }

  /**
   * Requests a Socratic hint from the companion.
   * If WebLLM is ready, queries the quantized LLM in the dedicated worker.
   * If WebLLM is uninitialized, loading, in fallback mode, or fails,
   * transparently returns deterministic Socratic scaffolding via MentorSystem.
   */
  public async generateHint(context?: HintContext, userQuery?: string): Promise<string> {
    // If not ready, immediately provide deterministic Socratic fallback
    if (this.status !== "ready" || !this.worker) {
      return this.getFallbackHint(context);
    }

    const requestId = `hint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const message: WorkerGenerateHintMessage = {
      type: "GENERATE_HINT",
      id: requestId,
      context,
      userQuery,
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
    };

    return new Promise<string>((resolve) => {
      // 10-second safety timeout to avoid any hang
      const timeoutTimer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        console.warn("[WebLLMClient] Inference request timed out. Returning fallback hint.");
        resolve(this.getFallbackHint(context));
      }, 10000);

      if (typeof timeoutTimer.unref === "function") {
        timeoutTimer.unref();
      }

      this.pendingRequests.set(requestId, {
        resolve: (hint: string) => {
          clearTimeout(timeoutTimer);
          resolve(hint && hint.trim().length > 0 ? hint : this.getFallbackHint(context));
        },
        reject: (err: Error) => {
          clearTimeout(timeoutTimer);
          console.warn("[WebLLMClient] Worker inference error. Returning fallback hint:", err);
          resolve(this.getFallbackHint(context));
        },
      });

      this.worker?.postMessage(message);
    });
  }

  /**
   * Deterministic fallback provider powered by MentorSystem.ts.
   */
  public getFallbackHint(context?: HintContext): string {
    if (context?.entities && context.entities.length > 0) {
      const dialog = MentorSystem.selectDirectHint(context.entities);
      return dialog.text;
    }
    return "Look around the room together with me! Do you notice anything that can be moved?";
  }

  /**
   * Attaches lifecycle and progress event listeners to the underlying worker.
   */
  private attachWorkerListeners(worker: Worker): void {
    worker.addEventListener("message", (event: MessageEvent<WorkerToClientMessage>) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "INIT_PROGRESS": {
          const report: DownloadProgress = {
            progress: msg.progress,
            percentage: msg.percentage,
            text: msg.text,
          };
          this.lastProgress = report;
          this.progressListeners.forEach((listener) => {
            try {
              listener(report);
            } catch (e) {
              console.error("[WebLLMClient] Error in progress listener:", e);
            }
          });
          break;
        }

        case "READY": {
          this.setStatus("ready");
          break;
        }

        case "HINT_RESULT":
        case "GENERATE_HINT": {
          const pending = this.pendingRequests.get(msg.id);
          if (pending) {
            this.pendingRequests.delete(msg.id);
            pending.resolve(msg.hint);
          }
          break;
        }

        case "ERROR": {
          if (msg.id) {
            const pending = this.pendingRequests.get(msg.id);
            if (pending) {
              this.pendingRequests.delete(msg.id);
              pending.reject(new Error(msg.error));
            }
          } else {
            console.warn("[WebLLMClient] Worker reported unhandled error:", msg.error);
            if (this.status === "loading") {
              this.setStatus("fallback");
            }
          }
          break;
        }

        default:
          break;
      }
    });

    worker.addEventListener("error", (event) => {
      console.error("[WebLLMClient] Worker encountered runtime error:", event);
      this.setStatus("fallback");
      // Reject any pending requests so they fall back immediately
      this.pendingRequests.forEach((req) => {
        req.reject(new Error("Worker error"));
      });
      this.pendingRequests.clear();
    });
  }

  private setStatus(newStatus: WebLLMStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newStatus);
        } catch (e) {
          console.error("[WebLLMClient] Error in status listener:", e);
        }
      });
    }
  }

  /**
   * Terminates the background worker and flushes pending requests.
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.forEach((req) => {
      req.reject(new Error("WebLLMClient terminated"));
    });
    this.pendingRequests.clear();
    this.setStatus("uninitialized");
    this.initPromise = null;
  }
}
