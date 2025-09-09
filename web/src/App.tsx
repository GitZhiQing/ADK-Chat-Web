import React, { useState, useEffect, useRef } from "react";
import type { SessionSimple, Session } from "./types/session";
import type { Event } from "./types/event";
import type { RunAgentRequest } from "./types/request";
import * as api from "./api";

const App: React.FC = () => {
  // State management
  const [apps, setApps] = useState<string[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [userId, setUserId] = useState<string>("user");
  const [sessions, setSessions] = useState<SessionSimple[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Event[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load apps on component mount
  useEffect(() => {
    loadApps();
  }, []);

  // Load sessions when app or user changes
  useEffect(() => {
    if (selectedApp && userId) {
      loadSessions();
    }
  }, [selectedApp, userId]);

  // Update messages when session changes
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.events);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus textarea when session changes
  useEffect(() => {
    if (currentSession && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentSession]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  // Get text content from message
  const getMessageText = (message: Event): string => {
    if (!message.content?.parts) return "";
    return message.content.parts
      .filter((part) => part.text)
      .map((part) => part.text)
      .join("\n");
  };

  const loadApps = async () => {
    try {
      const appList = await api.listApps();
      setApps(appList);
      if (appList.length > 0) {
        setSelectedApp(appList[0]);
      }
    } catch (err) {
      setError("Failed to load apps: " + (err as Error).message);
    }
  };

  const loadSessions = async () => {
    if (!selectedApp || !userId) return;

    try {
      const sessionList = await api.listSessions(selectedApp, userId);
      setSessions(sessionList);
    } catch (err) {
      setError("Failed to load sessions: " + (err as Error).message);
    }
  };

  const createNewSession = async () => {
    if (!selectedApp || !userId) return;

    try {
      setIsLoading(true);
      const session = await api.createSession(selectedApp, userId);
      setCurrentSession(session);
      setSessions([session, ...sessions]);
    } catch (err) {
      setError("Failed to create session: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    if (!selectedApp || !userId) return;

    try {
      setIsLoading(true);
      const session = await api.getSession(selectedApp, userId, sessionId);
      setCurrentSession(session);
    } catch (err) {
      setError("Failed to load session: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelectedSession = async () => {
    if (!currentSession || !selectedApp || !userId) return;

    try {
      setIsLoading(true);
      await api.deleteSession(selectedApp, userId, currentSession.id);
      setSessions(sessions.filter((s) => s.id !== currentSession.id));
      setCurrentSession(null);
    } catch (err) {
      setError("Failed to delete session: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || !selectedApp || !userId)
      return;

    try {
      setIsLoading(true);

      // Add user message to UI immediately
      const userMessage: Event = {
        id: Date.now().toString(),
        timestamp: Date.now() / 1000,
        author: "user",
        invocationId: "manual-" + Date.now().toString(),
        actions: {
          stateDelta: {},
          artifactDelta: {},
          requestedAuthConfigs: {},
        },
        content: {
          role: "user",
          parts: [{ text: inputMessage }],
        },
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");

      // Prepare request
      const request: RunAgentRequest = {
        appName: selectedApp,
        userId: userId,
        sessionId: currentSession.id,
        newMessage: {
          role: "user",
          parts: [{ text: inputMessage }],
        },
        streaming: true,
      };

      // Use the fetch-based SSE implementation
      const reader = await api.runAgentWithFetch(request);
      if (!reader) {
        throw new Error("Failed to establish connection");
      }

      // Process streaming response
      await processStreamingResponse(reader);
    } catch (err) {
      setError("Failed to send message: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const processStreamingResponse = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ) => {
    try {
      const partialEvents: Map<string, Event> = new Map(); // Store partial events by invocationId

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert Uint8Array to string
        const text = new TextDecoder().decode(value);

        // Split by newlines to get individual events
        const lines = text.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            // Remove 'data:' prefix if present
            const jsonData = line.startsWith("data:")
              ? line.slice(5).trim()
              : line.trim();

            if (jsonData === "[DONE]") {
              // End of stream
              continue;
            }

            const event: Event = JSON.parse(jsonData);

            // Handle partial events
            if (event.partial === true) {
              // Store partial event
              partialEvents.set(event.invocationId, event);
            } else if (event.partial === false) {
              // This is the final event, combine with partials if any
              const partialEvent = partialEvents.get(event.invocationId);
              if (partialEvent) {
                // Combine texts from partial events
                const combinedEvent = combinePartialEvents(partialEvent, event);
                setMessages((prev) => [...prev, combinedEvent]);
                partialEvents.delete(event.invocationId);
              } else {
                // No partials, just add the event
                setMessages((prev) => [...prev, event]);
              }
            } else {
              // Not a partial event, just add it
              setMessages((prev) => [...prev, event]);
            }
          } catch (parseErr) {
            console.warn("Failed to parse event:", line, parseErr);
          }
        }
      }
    } catch (err) {
      console.error("Error processing stream:", err);
    } finally {
      reader.releaseLock();
    }
  };

  const combinePartialEvents = (
    partialEvent: Event,
    finalEvent: Event,
  ): Event => {
    // Combine text content from partial and final events
    if (partialEvent.content?.parts && finalEvent.content?.parts) {
      // Find text parts in both events
      const partialTextParts = partialEvent.content.parts.filter(
        (part) => part.text,
      );
      const finalTextParts = finalEvent.content.parts.filter(
        (part) => part.text,
      );

      // Combine texts (assuming single text part for simplicity)
      if (partialTextParts.length > 0 && finalTextParts.length > 0) {
        // For streaming responses, the final event contains the complete text
        // We should use the final text directly
        const finalText = finalTextParts[0].text || "";

        // Create new event with combined text
        return {
          ...finalEvent,
          content: {
            ...finalEvent.content,
            parts: [
              ...finalTextParts.slice(1), // Keep other parts if any
              { text: finalText },
            ],
          },
        };
      }
    }

    // If we can't combine properly, return the final event
    return finalEvent;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Chat Web</h1>
        <div className="app-controls">
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            disabled={isLoading}
          >
            {apps.map((app) => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="用户ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isLoading}
          />

          <button
            onClick={loadSessions}
            disabled={isLoading || !selectedApp || !userId}
          >
            加载会话
          </button>
        </div>
      </header>

      <div className="app-main">
        {/* Sidebar for session management */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>会话列表</h3>
          </div>

          <div className="session-management">
            <div className="session-list-container">
              <ul className="session-list">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className={
                      currentSession?.id === session.id ? "active" : ""
                    }
                    onClick={() => selectSession(session.id)}
                  >
                    <div className="session-info">
                      <div className="session-id">
                        {session.id.substring(0, 8)}...
                      </div>
                      <div className="session-time">
                        {new Date(
                          session.lastUpdateTime * 1000,
                        ).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentSession?.id === session.id) {
                          deleteSelectedSession();
                        } else {
                          api.deleteSession(selectedApp, userId, session.id);
                          setSessions(
                            sessions.filter((s) => s.id !== session.id),
                          );
                        }
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="session-actions">
              <button
                onClick={createNewSession}
                disabled={isLoading || !selectedApp || !userId}
              >
                新建会话
              </button>
              {currentSession && (
                <button onClick={deleteSelectedSession} disabled={isLoading}>
                  删除会话
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-container">
          {error && <div className="error">{error}</div>}

          <div className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.author === "user" ? "user-message" : "agent-message"
                }`}
              >
                <div className="message-author">{message.author}</div>
                <div className="message-content">
                  {message.content?.parts.map((part, index) => (
                    <div key={index}>
                      {part.text && <p>{part.text}</p>}
                      {part.functionCall && (
                        <div className="function-call">
                          <strong>工具调用:</strong> {part.functionCall.name}
                          <pre>
                            {JSON.stringify(part.functionCall.args, null, 2)}
                          </pre>
                        </div>
                      )}
                      {part.functionResponse && (
                        <div className="function-response">
                          <strong>工具响应:</strong>{" "}
                          {part.functionResponse.name}
                          <pre>
                            {JSON.stringify(
                              part.functionResponse.response,
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="copy-button"
                  onClick={() =>
                    copyToClipboard(getMessageText(message), message.id)
                  }
                  title={isCopied[message.id] ? "Copied!" : "Copy message"}
                >
                  {isCopied[message.id] ? "✓" : "📋"}
                </button>
                <div className="message-time">
                  {new Date(message.timestamp * 1000).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {currentSession ? (
            <div className="input-area">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    sendMessage();
                  } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="今天你想问什么... (Enter 发送/Shift+Enter 换行)"
                disabled={isLoading}
                rows={3}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          ) : (
            <div className="no-session">
              <p>请选择或创建会话来开始</p>
              <button
                onClick={createNewSession}
                disabled={isLoading || !selectedApp || !userId}
              >
                创建会话
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
