"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WebLLMClient, WebLLMClientOptions } from "../lib/webllm/WebLLMClient";
import { DownloadProgress, HintContext, WebLLMStatus } from "../lib/webllm/types";

export interface UseWebLLMOptions extends WebLLMClientOptions {
  autoInit?: boolean;
}

export interface UseWebLLMReturn {
  status: WebLLMStatus;
  isReady: boolean;
  isLoading: boolean;
  isFallback: boolean;
  progress: number; // 0 to 100
  progressText: string;
  generateHint: (context?: HintContext, userQuery?: string) => Promise<string>;
  init: () => Promise<void>;
  client: WebLLMClient | null;
}

export function useWebLLM(options: UseWebLLMOptions = {}): UseWebLLMReturn {
  const [status, setStatus] = useState<WebLLMStatus>("uninitialized");
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>("");
  const clientRef = useRef<WebLLMClient | null>(null);

  useEffect(() => {
    const client = new WebLLMClient({
      modelId: options.modelId,
      worker: options.worker,
      workerFactory: options.workerFactory,
    });
    clientRef.current = client;

    const unsubStatus = client.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubProgress = client.onProgress((p: DownloadProgress) => {
      setProgress(p.percentage);
      setProgressText(p.text);
    });

    if (options.autoInit) {
      client.init().catch((err) => {
        console.warn("[useWebLLM] Failed auto-init:", err);
      });
    }

    return () => {
      unsubStatus();
      unsubProgress();
      client.terminate();
    };
  }, [options.modelId, options.worker, options.workerFactory, options.autoInit]);

  const init = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.init();
    }
  }, []);

  const generateHint = useCallback(
    async (context?: HintContext, userQuery?: string): Promise<string> => {
      if (clientRef.current) {
        return clientRef.current.generateHint(context, userQuery);
      }
      return "Look around the room together with me! Do you notice anything that can be moved?";
    },
    []
  );

  return {
    status,
    isReady: status === "ready",
    isLoading: status === "loading",
    isFallback: status === "fallback",
    progress,
    progressText,
    generateHint,
    init,
    client: clientRef.current,
  };
}
