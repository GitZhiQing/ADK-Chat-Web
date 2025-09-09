import { useCallback } from "react";
import * as api from "../api";
import type { RunAgentRequest } from "../types/request";
import type { Event } from "../types/event";

export const useMessages = () => {
  const runAgentWithFetch = useCallback(async (request: RunAgentRequest): Promise<ReadableStreamDefaultReader<Uint8Array> | null> => {
    try {
      return await api.runAgentWithFetch(request);
    } catch (error) {
      console.error("Failed to run agent:", error);
      throw error;
    }
  }, []);

  return {
    runAgentWithFetch
  };
};
