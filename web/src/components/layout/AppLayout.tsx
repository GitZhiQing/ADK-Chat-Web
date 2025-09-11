import React, { useEffect, useRef } from 'react';
import { Layout, Button, Alert, Divider, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useSessions } from '../../hooks/useSessions';
import { useMessages } from '../../hooks/useMessages';
import { useAppManager } from '../../hooks/useAppManager';
import { SessionList } from '../session/SessionList';
import { WelcomeComponent } from '../chat/Welcome';
import { AppBar } from './AppBar';
import type { RunAgentRequest } from '../../types/request';
import type { Event } from '../../types/event';
import styles from '../../styles/global.module.css';

const { Sider, Content } = Layout;

// 主页布局组件（无会话状态）
export const AppLayout: React.FC = () => {
  const { sessions, currentSession, messages, isLoading, error, dispatch } = useChat();

  const { selectedApp, userId, loadApps } = useAppManager();
  const navigate = useNavigate();
  const { listSessions: fetchSessions, createSession } = useSessions();
  const { runAgentWithFetch } = useMessages();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化时加载应用列表
  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Load sessions when app or user changes
  useEffect(() => {
    if (selectedApp && userId) {
      loadSessions();
    } else {
      // Clear sessions when app or user is not selected
      dispatch({ type: 'SET_SESSIONS', payload: [] });
    }
  }, [selectedApp, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    if (!selectedApp || !userId) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const sessionList = await fetchSessions(selectedApp, userId);
      dispatch({ type: 'SET_SESSIONS', payload: sessionList });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to load sessions: ' + (err as Error).message,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createNewSession = async (message: string) => {
    if (!selectedApp || !userId) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const session = await createSession(selectedApp, userId);
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      dispatch({ type: 'SET_SESSIONS', payload: [session, ...sessions] });
      dispatch({ type: 'SET_MESSAGES', payload: [] });

      // 导航到会话页面（在发送消息之前）
      navigate(`/sessions/${session.id}`);

      // 在会话页面发送消息
      if (session && session.id && selectedApp) {
        // 使用setTimeout确保导航完成后再发送消息
        setTimeout(() => {
          sendFirstMessage(message, session.id, selectedApp, userId);
        }, 100);
      }

      return session;
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to create session: ' + (err as Error).message,
      });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 处理会话创建后的首次消息发送
  const sendFirstMessage = async (
    inputMessage: string,
    sessionId: string,
    appName: string,
    userId: string
  ) => {
    if (!inputMessage.trim() || !sessionId || !appName || !userId) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Add user message to UI immediately
      const userMessage: Event = {
        id: Date.now().toString(),
        timestamp: Date.now() / 1000,
        author: 'user',
        invocationId: 'manual-' + Date.now().toString(),
        actions: {
          stateDelta: {},
          artifactDelta: {},
          requestedAuthConfigs: {},
        },
        content: {
          role: 'user',
          parts: [{ text: inputMessage }],
        },
      };

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // Prepare request
      const request: RunAgentRequest = {
        appName: appName,
        userId: userId,
        sessionId: sessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: inputMessage }],
        },
        streaming: true,
      };

      // Use the fetch-based SSE implementation
      const reader = await runAgentWithFetch(request);
      if (!reader) {
        throw new Error('Failed to establish connection');
      }

      // Process streaming response
      await processStreamingResponse(reader);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to send message: ' + (err as Error).message,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const processStreamingResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    try {
      const partialEvents: Map<string, Event> = new Map(); // Store partial events by invocationId

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert Uint8Array to string
        const text = new TextDecoder().decode(value);

        // Split by newlines to get individual events
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            // Remove 'data:' prefix if present
            const jsonData = line.startsWith('data:') ? line.slice(5).trim() : line.trim();

            if (jsonData === '[DONE]') {
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
                dispatch({
                  type: 'UPDATE_PARTIAL_MESSAGE',
                  payload: updatedEvent,
                });
              } else {
                // Store the first partial event
                partialEvents.set(event.invocationId, event);
                // Add the partial event to the UI
                dispatch({ type: 'ADD_MESSAGE', payload: event });
              }
            } else if (event.partial === false) {
              // This is the final event, replace the partial events
              const partialEvent = partialEvents.get(event.invocationId);
              if (partialEvent) {
                // Replace the partial event with the final event
                dispatch({
                  type: 'REPLACE_PARTIAL_MESSAGE',
                  payload: { partialEvent, finalEvent: event },
                });
                partialEvents.delete(event.invocationId);
              } else {
                // No partials, just add the event
                dispatch({ type: 'ADD_MESSAGE', payload: event });
              }
            } else {
              // Not a partial event, just add it
              // Check if we have any partial events for this invocationId
              const partialEvent = partialEvents.get(event.invocationId);
              if (partialEvent) {
                // Replace the partial event with this complete event
                dispatch({
                  type: 'REPLACE_PARTIAL_MESSAGE',
                  payload: { partialEvent, finalEvent: event },
                });
                partialEvents.delete(event.invocationId);
              } else {
                // No partials, just add the event
                dispatch({ type: 'ADD_MESSAGE', payload: event });
              }
            }
          } catch (parseErr) {
            console.warn('Failed to parse event:', line, parseErr);
          }
        }
      }
    } catch (err) {
      console.error('Error processing stream:', err);
    } finally {
      reader.releaseLock();
    }
  };

  const appendPartialEvent = (existingEvent: Event, newEvent: Event): Event => {
    // Append text content from new partial event to existing event
    if (existingEvent.content?.parts && newEvent.content?.parts) {
      // Find text parts in both events
      const existingTextParts = existingEvent.content.parts.filter(part => part.text);
      const newTextParts = newEvent.content.parts.filter(part => part.text);

      // Combine texts (assuming single text part for simplicity)
      if (existingTextParts.length > 0 && newTextParts.length > 0) {
        const combinedText = (existingTextParts[0].text || '') + (newTextParts[0].text || '');

        // Create new event with combined text
        return {
          ...existingEvent,
          content: {
            ...existingEvent.content,
            parts: [
              ...existingEvent.content.parts.filter(part => !part.text), // Keep non-text parts
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
    <div className={styles.container}>
      <AppBar showControls={true} onReload={loadSessions} />

      <div className={styles.main}>
        {/* Sidebar for session management */}
        <Sider width={300} theme="light" className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
                navigate('/');
              }}
              disabled={isLoading || !selectedApp || !userId}
              className={styles.actionBtn}
            >
              新建会话
            </Button>
            <Divider />
            <Typography.Title
              level={4}
              className={styles.sidebarTitle}
              style={{ margin: 0, padding: 0 }}
            >
              会话列表
            </Typography.Title>
          </div>

          <SessionList
            sessions={sessions}
            currentSession={currentSession}
            onSelectSession={sessionId => {
              // 导航到会话页面
              navigate(`/sessions/${sessionId}`);
            }}
          />
        </Sider>

        {/* Main chat area */}
        <Content className={styles.chatArea}>
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => dispatch({ type: 'CLEAR_ERROR' })}
              className={styles.errorAlert}
            />
          )}

          <WelcomeComponent
            isLoading={isLoading}
            selectedApp={selectedApp || ''}
            userId={userId}
            onSendMessage={async message => {
              // 创建新会话并发送消息
              await createNewSession(message);
            }}
          />
        </Content>
      </div>
    </div>
  );
};
