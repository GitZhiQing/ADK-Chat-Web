import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Welcome } from "@ant-design/x";

interface NoSessionProps {
  onCreateSession: () => void;
  isLoading: boolean;
  selectedApp: string;
  userId: string;
}

export const NoSession: React.FC<NoSessionProps> = ({
  onCreateSession,
  isLoading,
  selectedApp,
  userId,
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <Welcome
        title="AI Chat Web"
        description="请选择或创建会话来开始聊天"
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreateSession}
        disabled={isLoading || !selectedApp || !userId}
        size="large"
        style={{ marginTop: "24px" }}
      >
        创建会话
      </Button>
    </div>
  );
};
