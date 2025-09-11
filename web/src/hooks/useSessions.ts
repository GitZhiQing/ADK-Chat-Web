import { useCallback } from 'react';
import * as api from '../api';
import type { Session, SessionSimple } from '../types/session';

export const useSessions = () => {
  const listSessions = useCallback(
    async (appName: string, userId: string): Promise<SessionSimple[]> => {
      try {
        return await api.listSessions(appName, userId);
      } catch (error) {
        console.error('Failed to list sessions:', error);
        throw error;
      }
    },
    []
  );

  const createSession = useCallback(async (appName: string, userId: string): Promise<Session> => {
    try {
      return await api.createSession(appName, userId);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }, []);

  const getSession = useCallback(
    async (appName: string, userId: string, sessionId: string): Promise<Session> => {
      try {
        return await api.getSession(appName, userId, sessionId);
      } catch (error) {
        console.error('Failed to get session:', error);
        throw error;
      }
    },
    []
  );

  const deleteSession = useCallback(
    async (appName: string, userId: string, sessionId: string): Promise<void> => {
      try {
        return await api.deleteSession(appName, userId, sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
        throw error;
      }
    },
    []
  );

  return {
    listSessions,
    createSession,
    getSession,
    deleteSession,
  };
};
