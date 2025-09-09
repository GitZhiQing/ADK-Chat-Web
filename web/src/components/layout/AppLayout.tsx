import React, { useEffect, useRef } from "react";
import { Layout, Typography, Select, Input, Button, Alert } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useChat } from "../../contexts/ChatContext";
import { useApps } from "../../hooks/useApps";
import { useSessions } from "../../hooks/useSessions";
import { useMessages } from "../../hooks/useMessages";
import { SessionList } from "../session/SessionList";
import { ChatArea } from "../chat/ChatArea";
import { NoSession } from "../chat/NoSession";
import type { RunAgentRequest } from "../../types/request";
import type { Event } from "../../types/event";

const { Header, Sider, Content } = Layout;

export const AppLayout: React.FC = () => {
  const {
    apps,
    selectedApp,
    userId,
    sessions,
    currentSession,
    messages,
    isLoading,
    error,
    dispatch,
  } = useChat();

  const { listApps } = useApps();
  const { listSessions: fetchSessions, createSession, getSession } = useSessions();
  const { runAgentWithFetch } = useMessages();

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadApps = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const appList = await listApps();
      dispatch({ type: "SET_APPS", payload: appList });
      if (appList.length > 0) {
        dispatch({ type: "SET_SELECTED_APP", payload: appList[0] });
      }
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load apps: " + (err as Error).message,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const loadSessions = async () => {
    if (!selectedApp || !userId) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const sessionList = await fetchSessions(selectedApp, userId);
      dispatch({ type: "SET_SESSIONS", payload: sessionList });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load sessions: " + (err as Error).message,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const createNewSession = async () => {
    if (!selectedApp || !userId) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const session = await createSession(selectedApp, userId);
      dispatch({ type: "SET_CURRENT_SESSION", payload: session });
      dispatch({ type: "SET_SESSIONS", payload: [session, ...sessions] });
      dispatch({ type: "SET_MESSAGES", payload: [] });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to create session: " + (err as Error).message,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const selectSession = async (sessionId: string) => {
    if (!selectedApp || !userId) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const session = await getSession(selectedApp, userId, sessionId);
      dispatch({ type: "SET_CURRENT_SESSION", payload: session });
      dispatch({ type: "SET_MESSAGES", payload: session.events });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load session: " + (err as Error).message,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const sendMessage = async (inputMessage: string) => {
    if (!inputMessage.trim() || !currentSession || !selectedApp || !userId)
      return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });

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

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

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
      const reader = await runAgentWithFetch(request);
      if (!reader) {
        throw new Error("Failed to establish connection");
      }

      // Process streaming response
      await processStreamingResponse(reader);
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to send message: " + (err as Error).message,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const processStreamingResponse = async (
    reader: ReadableStreamDefaultReader<Uint8Array>
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
              // Check if we already have a partial event with the same invocationId
              const existingPartialEvent = partialEvents.get(event.invocationId);
              if (existingPartialEvent) {
                // Append the new text to the existing partial event
                const updatedEvent = appendPartialEvent(existingPartialEvent, event);
                partialEvents.set(event.invocationId, updatedEvent);
                // Update the UI with the appended partial event
                dispatch({ type: "UPDATE_PARTIAL_MESSAGE", payload: updatedEvent });
              } else {
                // Store the first partial event
                partialEvents.set(event.invocationId, event);
                // Add the partial event to the UI
                dispatch({ type: "ADD_MESSAGE", payload: event });
              }
            } else if (event.partial === false) {
              // This is the final event, replace the partial events
              const partialEvent = partialEvents.get(event.invocationId);
              if (partialEvent) {
                // Replace the partial event with the final event
                dispatch({ type: "REPLACE_PARTIAL_MESSAGE", payload: { partialEvent, finalEvent: event } });
                partialEvents.delete(event.invocationId);
              } else {
                // No partials, just add the event
                dispatch({ type: "ADD_MESSAGE", payload: event });
              }
            } else {
              // Not a partial event, just add it
              // Check if we have any partial events for this invocationId
              const partialEvent = partialEvents.get(event.invocationId);
              if (partialEvent) {
                // Replace the partial event with this complete event
                dispatch({ type: "REPLACE_PARTIAL_MESSAGE", payload: { partialEvent, finalEvent: event } });
                partialEvents.delete(event.invocationId);
              } else {
                // No partials, just add the event
                dispatch({ type: "ADD_MESSAGE", payload: event });
              }
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

  const appendPartialEvent = (existingEvent: Event, newEvent: Event): Event => {
    // Append text content from new partial event to existing event
    if (existingEvent.content?.parts && newEvent.content?.parts) {
      // Find text parts in both events
      const existingTextParts = existingEvent.content.parts.filter(
        (part) => part.text
      );
      const newTextParts = newEvent.content.parts.filter(
        (part) => part.text
      );

      // Combine texts (assuming single text part for simplicity)
      if (existingTextParts.length > 0 && newTextParts.length > 0) {
        const combinedText = (existingTextParts[0].text || "") + (newTextParts[0].text || "");
        
        // Create new event with combined text
        return {
          ...existingEvent,
          content: {
            ...existingEvent.content,
            parts: [
              ...existingEvent.content.parts.filter((part) => !part.text), // Keep non-text parts
              { text: combinedText },
            ],
          },
        };
      }
    }

    // If we can't combine properly, return the new event
    return newEvent;
  };


  return (
    <div className="app">
      <Header
        style={{
          background: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          AI Chat Web
        </Typography.Title>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Select
            value={selectedApp}
            onChange={(value) =>
              dispatch({ type: "SET_SELECTED_APP", payload: value })
            }
            disabled={isLoading}
            style={{ width: 150 }}
            options={apps.map((app) => ({ label: app, value: app }))}
          />

          <Input
            placeholder="用户ID"
            value={userId}
            onChange={(e) =>
              dispatch({ type: "SET_USER_ID", payload: e.target.value })
            }
            disabled={isLoading}
            style={{ width: 120 }}
          />

          <Button
            onClick={loadSessions}
            disabled={isLoading || !selectedApp || !userId}
            type="primary"
          >
            加载会话
          </Button>
        </div>
      </Header>

      <div className="app-main">
        {/* Sidebar for session management */}
        <Sider
          width={300}
          theme="light"
          style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <Typography.Title level={4} style={{ margin: 0, marginBottom: "16px" }}>
              会话列表
            </Typography.Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createNewSession}
              disabled={isLoading || !selectedApp || !userId}
              block
            >
              新建会话
            </Button>
          </div>

          <SessionList 
            sessions={sessions} 
            currentSession={currentSession} 
            onSelectSession={selectSession} 
          />
        </Sider>

        {/* Main chat area */}
        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#f5f5f5",
          }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => dispatch({ type: "CLEAR_ERROR" })}
              style={{ margin: "16px" }}
            />
          )}

          {currentSession ? (
            <ChatArea isLoading={isLoading} onSendMessage={sendMessage} />
          ) : (
            <NoSession
              onCreateSession={createNewSession}
              isLoading={isLoading}
              selectedApp={selectedApp}
              userId={userId}
            />
          )}
        </Content>
      </div>
    </div>
  );
};
