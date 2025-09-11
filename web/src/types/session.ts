import type { Event } from './event';

export interface Session {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, any>;
  events: Event[];
  lastUpdateTime: number;
}

export interface SessionSimple {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, any>;
  events: any[]; // Empty array in simple version
  lastUpdateTime: number;
}
