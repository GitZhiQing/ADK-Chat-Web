import React from "react";
import { List, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../../contexts/ChatContext";
import { useSessions } from "../../../hooks/useSessions";
import type { SessionSimple, Session } from "../../../types/session";
import styles from "./SessionList.module.css";

interface SessionListProps {
  sessions: SessionSimple[];
  currentSession: Session | null;
  onSelectSession: (sessionId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSession,
  onSelectSession,
}) => {
  const navigate = useNavigate();
  const { selectedApp, userId, dispatch } = useChat();
  const { deleteSession: removeSession } = useSessions();

  // Sort sessions by last update time (newest first)
  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
  }, [sessions]);

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (currentSession?.id === sessionId) {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        await removeSession(selectedApp, userId, sessionId);
        dispatch({
          type: "SET_SESSIONS",
          payload: sortedSessions.filter((s) => s.id !== sessionId),
        });
        dispatch({ type: "SET_CURRENT_SESSION", payload: null });
        // 跳转到首页
        navigate("/");
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to delete session: " + (err as Error).message,
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } else {
      try {
        await removeSession(selectedApp, userId, sessionId);
        dispatch({
          type: "SET_SESSIONS",
          payload: sortedSessions.filter((s) => s.id !== sessionId),
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to delete session: " + (err as Error).message,
        });
      }
    }
  };

  // Format session title to show first few characters of the first message
  const formatSessionTitle = (session: SessionSimple) => {
    // Try to extract first message content if available
    if (session.events && session.events.length > 0) {
      const firstEvent = session.events[0];
      if (
        firstEvent.content &&
        firstEvent.content.parts &&
        firstEvent.content.parts.length > 0
      ) {
        const firstPart = firstEvent.content.parts[0];
        if (firstPart.text) {
          const maxLength = 20;
          return firstPart.text.length > maxLength
            ? firstPart.text.substring(0, maxLength) + "..."
            : firstPart.text;
        }
      }
    }

    // Fallback to session ID if no first message
    return session.id.substring(0, 20) + "...";
  };

  return (
    <div className={styles.sessionList}>
      <List
        dataSource={sortedSessions}
        renderItem={(session: SessionSimple) => (
          <List.Item
            key={session.id}
            onClick={() => {
              onSelectSession(session.id);
              navigate(`/sessions/${session.id}`);
            }}
            className={`${styles.sessionItem} ${
              currentSession?.id === session.id ? styles.sessionItemActive : ""
            }`}
          >
            <div className={styles.sessionContent}>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionTitle}>
                  {formatSessionTitle(session)}
                </div>
                <div className={styles.sessionTime}>
                  {new Date(
                    session.lastUpdateTime > 10000000000
                      ? session.lastUpdateTime
                      : session.lastUpdateTime * 1000
                  ).toLocaleString()}
                </div>
              </div>
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e) => handleDeleteSession(session.id, e)}
                className={styles.deleteBtn}
              />
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};
