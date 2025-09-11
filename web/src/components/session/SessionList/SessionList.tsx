import React from 'react';
import { List, Button, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../../contexts/ChatContext';
import { useSessions } from '../../../hooks/useSessions';
import type { SessionSimple, Session } from '../../../types/session';
import styles from './SessionList.module.css';

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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      if (currentSession?.id === sessionId) {
        dispatch({ type: 'SET_LOADING', payload: true });
        await removeSession(selectedApp, userId, sessionId);
        dispatch({
          type: 'SET_SESSIONS',
          payload: sortedSessions.filter(s => s.id !== sessionId),
        });
        dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
        // 显示删除成功提示
        message.success('会话删除成功');
        // 跳转到首页
        navigate('/');
      } else {
        await removeSession(selectedApp, userId, sessionId);
        dispatch({
          type: 'SET_SESSIONS',
          payload: sortedSessions.filter(s => s.id !== sessionId),
        });
        // 显示删除成功提示
        message.success('会话删除成功');
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to delete session: ' + (err as Error).message,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className={styles.sessionList}>
      <List
        dataSource={sortedSessions}
        bordered={false}
        renderItem={(session: SessionSimple) => (
          <List.Item
            key={session.id}
            onClick={() => {
              onSelectSession(session.id);
              navigate(`/sessions/${session.id}`);
            }}
            className={`${styles.sessionItem} ${
              currentSession?.id === session.id ? styles.sessionItemActive : ''
            }`}
          >
            <div className={styles.sessionContent}>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionTime}>
                  {new Date(
                    session.lastUpdateTime > 10000000000
                      ? session.lastUpdateTime
                      : session.lastUpdateTime * 1000
                  )
                    .toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })
                    .replace(/\//g, '-')}
                </div>
              </div>
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                className={styles.deleteBtn}
              />
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};
