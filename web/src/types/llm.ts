export interface Content {
  parts: Part[];
  role: string;
}

export interface Part {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
  codeExecutionResult?: CodeExecutionResult;
}

export interface FunctionCall {
  id: string;
  args: Record<string, any>;
  name: string;
}

export interface FunctionResponse {
  id: string;
  name: string;
  response: Record<string, any>;
}

export interface CodeExecutionResult {
  result?: string;
  status?: string;
  logs?: string;
}

export interface GroundingMetadata {
  // Define as needed based on API
  [key: string]: any;
}

export interface Transcription {
  // Define as needed based on API
  [key: string]: any;
}

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface LlmResponse {
  content?: Content;
  groundingMetadata?: GroundingMetadata;
  partial?: boolean;
  turnComplete?: boolean;
  finishReason?: string;
  errorCode?: string;
  errorMessage?: string;
  interrupted?: boolean;
  customMetadata?: Record<string, any>;
  usageMetadata?: UsageMetadata;
  liveSessionResumptionUpdate?: any;
  inputTranscription?: Transcription;
  outputTranscription?: Transcription;
}
