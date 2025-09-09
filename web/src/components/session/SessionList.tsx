import React from "react";
import { List, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useChat } from "../../contexts/ChatContext";
import { useSessions } from "../../hooks/useSessions";
import type { SessionSimple, Session } from "../../types/session";

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
  const { selectedApp, userId, dispatch } = useChat();
  const { deleteSession: removeSession } = useSessions();

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentSession?.id === sessionId) {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        await removeSession(selectedApp, userId, sessionId);
        dispatch({
          type: "SET_SESSIONS",
          payload: sessions.filter((s) => s.id !== sessionId),
        });
        dispatch({ type: "SET_CURRENT_SESSION", payload: null });
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
          payload: sessions.filter((s) => s.id !== sessionId),
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to delete session: " + (err as Error).message,
        });
      }
    }
  };

  return (
    <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
      <List
        dataSource={sessions}
        renderItem={(session: SessionSimple) => (
          <List.Item
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            style={{
              cursor: "pointer",
              background:
                currentSession?.id === session.id ? "#e6f4ff" : "transparent",
              borderRadius: "6px",
              marginBottom: "8px",
              border:
                currentSession?.id === session.id
                  ? "1px solid #91caff"
                  : "1px solid transparent",
            }}
          >
            <List.Item.Meta
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{session.id.substring(0, 8)}...</span>
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    danger
                  />
                </div>
              }
              description={
                <span style={{ fontSize: "12px", color: "#888" }}>
                  {new Date(session.lastUpdateTime * 1000).toLocaleString()}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};
