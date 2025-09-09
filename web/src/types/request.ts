import type { Content } from "./llm";

export interface RunAgentRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: Content;
  streaming: boolean;
  stateDelta?: Record<string, any> | null;
}

export interface CreateSessionRequest {
  // Empty interface as the request body can be empty
}
