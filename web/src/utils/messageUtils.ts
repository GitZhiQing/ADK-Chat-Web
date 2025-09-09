import type { Event } from "../types/event";
import type { FunctionCall, FunctionResponse } from "../types/llm";

/**
 * 获取消息的文本内容
 * @param message 消息对象
 * @returns 消息的纯文本内容
 */
export const getMessageText = (message: Event): string => {
  if (!message.content?.parts) return "";
  return message.content.parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join("\n");
};

/**
 * 检查是否为最终响应
 * @param event 事件对象
 * @returns 是否为最终响应
 */
export const isFinalResponse = (event: Event): boolean => {
  // Implementation would go here if needed
  return true;
};

/**
 * 获取函数调用列表
 * @param event 事件对象
 * @returns 函数调用数组
 */
export const getFunctionCalls = (event: Event): FunctionCall[] => {
  const funcCalls: FunctionCall[] = [];
  if (event.content && event.content.parts) {
    for (const part of event.content.parts) {
      if (part.functionCall) {
        funcCalls.push(part.functionCall);
      }
    }
  }
  return funcCalls;
};

/**
 * 获取函数响应列表
 * @param event 事件对象
 * @returns 函数响应数组
 */
export const getFunctionResponses = (event: Event): FunctionResponse[] => {
  const funcResponses: FunctionResponse[] = [];
  if (event.content && event.content.parts) {
    for (const part of event.content.parts) {
      if (part.functionResponse) {
        funcResponses.push(part.functionResponse);
      }
    }
  }
  return funcResponses;
};

/**
 * 检查是否有尾随代码执行结果
 * @param event 事件对象
 * @returns 是否有尾随代码执行结果
 */
export const hasTrailingCodeExecutionResult = (event: Event): boolean => {
  if (event.content) {
    if (event.content.parts && event.content.parts.length > 0) {
      const lastPart = event.content.parts[event.content.parts.length - 1];
      return lastPart.codeExecutionResult !== undefined;
    }
  }
  return false;
};
