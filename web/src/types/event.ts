import type { LlmResponse, FunctionCall, FunctionResponse } from "./llm";

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

export function isFinalResponse(event: Event): boolean {
  if (event.actions?.stateDelta || event.longRunningToolIds) {
    return true;
  }
  return (
    !getFunctionCalls(event).length &&
    !getFunctionResponses(event).length &&
    !event.partial &&
    !hasTrailingCodeExecutionResult(event)
  );
}

export function getFunctionCalls(event: Event): FunctionCall[] {
  const funcCalls: FunctionCall[] = [];
  if (event.content && event.content.parts) {
    for (const part of event.content.parts) {
      if (part.functionCall) {
        funcCalls.push(part.functionCall);
      }
    }
  }
  return funcCalls;
}

export function getFunctionResponses(event: Event): FunctionResponse[] {
  const funcResponses: FunctionResponse[] = [];
  if (event.content && event.content.parts) {
    for (const part of event.content.parts) {
      if (part.functionResponse) {
        funcResponses.push(part.functionResponse);
      }
    }
  }
  return funcResponses;
}

export function hasTrailingCodeExecutionResult(event: Event): boolean {
  if (event.content) {
    if (event.content.parts && event.content.parts.length > 0) {
      const lastPart = event.content.parts[event.content.parts.length - 1];
      return lastPart.codeExecutionResult !== undefined;
    }
  }
  return false;
}
