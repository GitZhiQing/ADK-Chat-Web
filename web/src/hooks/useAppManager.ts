import { useCallback, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { useApps } from "./useApps";

// 本地存储键名
const APP_NAME_KEY = "selectedAppName";
const USER_ID_KEY = "userId";

export const useAppManager = () => {
  const { apps, selectedApp, userId, dispatch } = useChat();
  const { listApps } = useApps();

  // 从本地存储初始化状态
  useEffect(() => {
    const savedAppName = localStorage.getItem(APP_NAME_KEY);
    const savedUserId = localStorage.getItem(USER_ID_KEY);
    
    if (savedAppName) {
      dispatch({ type: "SET_SELECTED_APP", payload: savedAppName });
    }
    
    if (savedUserId) {
      dispatch({ type: "SET_USER_ID", payload: savedUserId });
    }
  }, [dispatch]);

  // 保存app名称到本地存储
  const setSelectedApp = useCallback((appName: string) => {
    dispatch({ type: "SET_SELECTED_APP", payload: appName });
    localStorage.setItem(APP_NAME_KEY, appName);
  }, [dispatch]);

  // 保存用户ID到本地存储
  const setUserId = useCallback((id: string) => {
    dispatch({ type: "SET_USER_ID", payload: id });
    localStorage.setItem(USER_ID_KEY, id);
  }, [dispatch]);

  // 加载可用的应用列表
  const loadApps = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const appList = await listApps();
      dispatch({ type: "SET_APPS", payload: appList });
      
      // 如果没有保存的应用且有可用应用，选择第一个
      if ((!selectedApp || selectedApp === "") && appList.length > 0) {
        setSelectedApp(appList[0]);
      }
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load apps: " + (err as Error).message,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [listApps, selectedApp, dispatch, setSelectedApp]);

  return {
    apps,
    selectedApp,
    userId,
    setSelectedApp,
    setUserId,
    loadApps
  };
};
