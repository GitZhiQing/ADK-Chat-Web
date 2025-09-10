import React from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import { ChatProvider } from "./contexts/ChatContext";
import { AppLayout } from "./components/layout/AppLayout";
import { SessionLayout } from "./components/layout/SessionLayout";
import ThemeDemo from "./components/theme/ThemeDemo";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import zhCN from "antd/locale/zh_CN";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <ChatProvider>
            <Routes>
              <Route path="/" element={<AppLayout key="home" />} />
              <Route path="/sessions/:sessionId" element={<SessionLayout key="session" />} />
              <Route path="/theme-demo" element={<ThemeDemo />} />
            </Routes>
          </ChatProvider>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
