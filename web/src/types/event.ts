import type { LlmResponse } from './llm';

export interface EventActions {
  stateDelta: Record<string, any>;
  artifactDelta: Record<string, any>;
  requestedAuthConfigs: Record<string, any>;
}

export interface Event extends LlmResponse {
  invocationId: string;
  author: string;
  actions: EventActions;
  longRunningToolIds?: string[];
  branch?: string;
  id: string;
  timestamp: number;
}
