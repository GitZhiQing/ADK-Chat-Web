import React, { useRef, useState } from "react";
import { Bubble, Sender } from "@ant-design/x";
import { Card, Button, Typography } from "antd";
import {
  CopyOutlined,
  CheckOutlined,
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import markdownit from "markdown-it";
import type { BubbleProps } from "@ant-design/x";
import { getMessageText } from "../../utils/messageUtils";
import { useChat } from "../../contexts/ChatContext";

const md = markdownit({ html: true, breaks: true });
const renderMarkdown: BubbleProps["messageRender"] = (content) => {
  return (
    <Typography style={{ fontSize: "14px", lineHeight: "1.5" }}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );
};

interface ChatAreaProps {
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  isLoading,
  onSendMessage,
}) => {
  const { messages } = useChat();
  const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Copy message to clipboard
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied((prev) => ({ ...prev, [messageId]: true }));
      setTimeout(() => {
        setIsCopied((prev) => ({ ...prev, [messageId]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <Bubble.List
          items={messages.map((message) => ({
            key: message.id,
            placement: message.author === "user" ? "end" : "start",
            avatar:
              message.author === "user" ? (
                <UserOutlined />
              ) : (
                <RobotOutlined />
              ),
            content: (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {message.content?.parts.map((part, index) => (
                  <React.Fragment key={index}>
                    {part.text && (
                      <Bubble
                        typing={message.author !== "user" && message.partial === true}
                        content={part.text}
                        messageRender={renderMarkdown}
                      />
                    )}
                    {part.functionCall && (
                      <Card
                        size="small"
                        title="工具调用"
                        style={{ margin: 0 }}
                      >
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>名称:</strong> {part.functionCall.name}
                        </p>
                        <pre
                          style={{
                            background: "#f0f0f0",
                            padding: "8px",
                            borderRadius: "4px",
                            overflowX: "auto",
                            margin: 0,
                            fontSize: "12px",
                          }}
                        >
                          {JSON.stringify(part.functionCall.args, null, 2)}
                        </pre>
                      </Card>
                    )}
                    {part.functionResponse && (
                      <Card
                        size="small"
                        title="工具响应"
                        style={{ margin: 0 }}
                      >
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>名称:</strong> {part.functionResponse.name}
                        </p>
                        <pre
                          style={{
                            background: "#f0f0f0",
                            padding: "8px",
                            borderRadius: "4px",
                            overflowX: "auto",
                            margin: 0,
                            fontSize: "12px",
                          }}
                        >
                          {JSON.stringify(
                            part.functionResponse.response,
                            null,
                            2
                          )}
                        </pre>
                      </Card>
                    )}
                    {part.codeExecutionResult && (
                      <Card
                        size="small"
                        title="代码执行结果"
                        style={{ margin: 0 }}
                      >
                        <p style={{ margin: "0 0 8px 0" }}>
                          <strong>状态:</strong> {part.codeExecutionResult.status || "未知"}
                        </p>
                        {part.codeExecutionResult.result && (
                          <pre
                            style={{
                              background: "#f0f0f0",
                              padding: "8px",
                              borderRadius: "4px",
                              overflowX: "auto",
                              margin: "0 0 8px 0",
                              fontSize: "12px",
                            }}
                          >
                            {part.codeExecutionResult.result}
                          </pre>
                        )}
                        {part.codeExecutionResult.logs && (
                          <details>
                            <summary>执行日志</summary>
                            <pre
                              style={{
                                background: "#f0f0f0",
                                padding: "8px",
                                borderRadius: "4px",
                                overflowX: "auto",
                                margin: "8px 0 0 0",
                                fontSize: "12px",
                              }}
                            >
                              {part.codeExecutionResult.logs}
                            </pre>
                          </details>
                        )}
                      </Card>
                    )}
                    {!part.text && !part.functionCall && !part.functionResponse && !part.codeExecutionResult && (
                      <Card
                        size="small"
                        title="未知内容类型"
                        style={{ margin: 0 }}
                      >
                        <pre
                          style={{
                            background: "#f0f0f0",
                            padding: "8px",
                            borderRadius: "4px",
                            overflowX: "auto",
                            margin: 0,
                            fontSize: "12px",
                          }}
                        >
                          {JSON.stringify(part, null, 2)}
                        </pre>
                      </Card>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ),
            footer: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#888" }}>
                  {new Date(message.timestamp * 1000).toLocaleTimeString()}
                </span>
                <Button
                  type="text"
                  icon={
                    isCopied[message.id] ? (
                      <CheckOutlined />
                    ) : (
                      <CopyOutlined />
                    )
                  }
                  onClick={() =>
                    copyToClipboard(getMessageText(message), message.id)
                  }
                  title={isCopied[message.id] ? "已复制!" : "复制消息"}
                />
              </div>
            ),
          }))}
        />
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: "16px",
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Sender
          onSubmit={async (value: string) => {
            // Simulate sending message
            await new Promise((resolve) => setTimeout(resolve, 100));
            onSendMessage(value);
          }}
          placeholder="今天你想问什么... (Enter 发送/Shift+Enter 换行)"
          disabled={isLoading}
        />
      </div>
    </>
  );
};
