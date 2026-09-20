import { MLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import {
  ClientToWorkerMessage,
  WorkerErrorMessage,
  WorkerHintResultMessage,
  WorkerInitProgressMessage,
  WorkerReadyMessage,
  SOCRATIC_SYSTEM_PROMPT,
  DEFAULT_MODEL_ID,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  buildUserPrompt,
} from "../lib/webllm/types";

let engine: MLCEngine | null = null;
let currentModelId = DEFAULT_MODEL_ID;

/**
 * Handle incoming messages from the main thread.
 */
async function handleMessage(event: MessageEvent<ClientToWorkerMessage>): Promise<void> {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  switch (data.type) {
    case "INIT": {
      try {
        // 1. Verify WebGPU availability inside worker context
        if (typeof navigator === "undefined" || !("gpu" in navigator) || !(navigator as any).gpu) {
          self.postMessage({
            type: "ERROR",
            code: "WEBGPU_UNAVAILABLE",
            error: "WebGPU is not supported in this browser or worker environment.",
          } as WorkerErrorMessage);
          return;
        }

        const modelId = data.modelId || DEFAULT_MODEL_ID;
        currentModelId = modelId;

        // 2. Instantiate MLCEngine with Safari ITP-safe CacheStorage backend
        engine = new MLCEngine({
          appConfig: {
            ...prebuiltAppConfig,
            cacheBackend: "cache",
            ...((data.appConfig as any) || {}),
          },
        });

        // 3. Register download and compilation progress callback
        engine.setInitProgressCallback((report) => {
          const percentage = Math.min(100, Math.max(0, Math.round(report.progress * 100)));
          self.postMessage({
            type: "INIT_PROGRESS",
            progress: report.progress,
            percentage,
            text: report.text,
          } as WorkerInitProgressMessage);
        });

        // 4. Load weights & compile WebGPU shaders
        await engine.reload(modelId);

        // 5. Signal readiness to the main thread
        self.postMessage({
          type: "READY",
          modelId,
        } as WorkerReadyMessage);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        self.postMessage({
          type: "ERROR",
          code: "INIT_FAILED",
          error: errorMsg,
        } as WorkerErrorMessage);
      }
      break;
    }

    case "GENERATE_HINT": {
      if (!engine) {
        self.postMessage({
          type: "ERROR",
          code: "NOT_INITIALIZED",
          id: data.id,
          error: "WebLLM engine is not initialized. Send INIT first.",
        } as WorkerErrorMessage);
        return;
      }

      try {
        const userContent = data.prompt || buildUserPrompt(data.context, data.userQuery);

        // Enforce strict pedagogical Socratic parameters:
        // System prompt under 20 words, temperature 0.3, max_tokens 35
        const completion = await engine.chat.completions.create({
          messages: [
            { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          temperature: data.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: data.maxTokens ?? DEFAULT_MAX_TOKENS,
        });

        const rawHint = completion.choices[0]?.message?.content?.trim() || "";
        // Clean up enclosing quotes if generated
        const hint = rawHint.replace(/^["']|["']$/g, "");

        // Post structured hint result back to main thread
        self.postMessage({
          type: "HINT_RESULT",
          id: data.id,
          hint,
        } as WorkerHintResultMessage);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        self.postMessage({
          type: "ERROR",
          code: "INFERENCE_FAILED",
          id: data.id,
          error: errorMsg,
        } as WorkerErrorMessage);
      }
      break;
    }

    default:
      break;
  }
}

self.addEventListener("message", (event) => {
  handleMessage(event as MessageEvent<ClientToWorkerMessage>).catch((err) => {
    self.postMessage({
      type: "ERROR",
      code: "UNHANDLED_EXCEPTION",
      error: err instanceof Error ? err.message : String(err),
    } as WorkerErrorMessage);
  });
});
