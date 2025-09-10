import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { SessionSimple, Session } from "../types/session";
import type { Event } from "../types/event";
import { useNavigate } from "react-router-dom";

// 定义状态类型
interface ChatState {
  apps: string[];
  selectedApp: string;
  userId: string;
  sessions: SessionSimple[];
  currentSession: Session | null /*  */;
  messages: Event[];
  isLoading: boolean;
  error: string | null;
}

// 定义动作类型
type ChatAction =
  | { type: "SET_APPS"; payload: string[] }
  | { type: "SET_SELECTED_APP"; payload: string }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_SESSIONS"; payload: SessionSimple[] }
  | { type: "SET_CURRENT_SESSION"; payload: Session | null }
  | { type: "ADD_MESSAGE"; payload: Event }
  | { type: "UPDATE_PARTIAL_MESSAGE"; payload: Event }
  | {
      type: "REPLACE_PARTIAL_MESSAGE";
      payload: { partialEvent: Event; finalEvent: Event };
    }
  | { type: "SET_MESSAGES"; payload: Event[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET_CHAT" };

// 初始状态
const initialState: ChatState = {
  apps: [],
  selectedApp: "",
  userId: "user",
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,
};

// Reducer 函数
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_APPS":
      return { ...state, apps: action.payload };
    case "SET_SELECTED_APP":
      return { ...state, selectedApp: action.payload };
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "SET_SESSIONS":
      return { ...state, sessions: action.payload };
    case "SET_CURRENT_SESSION":
      return { ...state, currentSession: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "UPDATE_PARTIAL_MESSAGE":
      // Find the partial message and update it
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.invocationId === action.payload.invocationId &&
          msg.partial === true
            ? action.payload
            : msg
        ),
      };
    case "REPLACE_PARTIAL_MESSAGE":
      // Replace the partial message with the final message
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.invocationId === action.payload.partialEvent.invocationId &&
          msg.partial === true
            ? action.payload.finalEvent
            : msg
        ),
      };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "RESET_CHAT":
      return { ...initialState };
    default:
      return state;
  }
}

// 创建 Context
interface ChatContextType extends ChatState {
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider 组件
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const navigate = useNavigate();
  
  // Store previous values to detect changes
  const prevSelectedApp = useRef(state.selectedApp);
  const prevUserId = useRef(state.userId);

  // Redirect to home and clear session when app or user changes
  useEffect(() => {
    // Check if app or user ID has changed
    if (
      (prevSelectedApp.current && prevSelectedApp.current !== state.selectedApp) ||
      (prevUserId.current && prevUserId.current !== state.userId)
    ) {
      // Update refs
      prevSelectedApp.current = state.selectedApp;
      prevUserId.current = state.userId;

      // Clear current session when app or user changes
      dispatch({ type: "SET_CURRENT_SESSION", payload: null });

      // Redirect to home
      navigate("/");
    } else {
      // Initialize refs on first render
      prevSelectedApp.current = state.selectedApp;
      prevUserId.current = state.userId;
    }
  }, [state.selectedApp, state.userId, navigate]);

  return (
    <ChatContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

// 自定义 Hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
