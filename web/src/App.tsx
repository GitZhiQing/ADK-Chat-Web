import React from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import { ChatProvider } from "./contexts/ChatContext";
import { AppLayout } from "./components/layout/AppLayout";
import zhCN from 'antd/locale/zh_CN';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <ChatProvider>
          <AppLayout />
        </ChatProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
