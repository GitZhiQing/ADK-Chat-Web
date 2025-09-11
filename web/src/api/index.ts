import axios from 'axios';
import type { Session, SessionSimple } from '../types/session';
import type { RunAgentRequest } from '../types/request';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const listApps = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>('/list-apps');
  return response.data;
};

export const listSessions = async (appName: string, userId: string): Promise<SessionSimple[]> => {
  const response = await apiClient.get<SessionSimple[]>(
    `/apps/${appName}/users/${userId}/sessions`
  );
  return response.data;
};

export const createSession = async (appName: string, userId: string): Promise<Session> => {
  const response = await apiClient.post<Session>(`/apps/${appName}/users/${userId}/sessions`);
  return response.data;
};

export const getSession = async (
  appName: string,
  userId: string,
  sessionId: string
): Promise<Session> => {
  const response = await apiClient.get<Session>(
    `/apps/${appName}/users/${userId}/sessions/${sessionId}`
  );
  return response.data;
};

export const deleteSession = async (
  appName: string,
  userId: string,
  sessionId: string
): Promise<void> => {
  await apiClient.delete(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);
};

// SSE implementation using fetch for POST requests
export const runAgentWithFetch = async (
  request: RunAgentRequest
): Promise<ReadableStreamDefaultReader<Uint8Array> | null> => {
  const response = await fetch(`${API_BASE_URL}/run_sse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (response.body) {
    return response.body.getReader();
  }
  return null;
};

export default apiClient;
