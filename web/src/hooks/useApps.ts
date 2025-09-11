import { useCallback } from 'react';
import * as api from '../api';

export const useApps = () => {
  const listApps = useCallback(async (): Promise<string[]> => {
    try {
      return await api.listApps();
    } catch (error) {
      console.error('Failed to list apps:', error);
      throw error;
    }
  }, []);

  return {
    listApps,
  };
};
