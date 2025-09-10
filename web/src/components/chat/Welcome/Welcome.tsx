import React from "react";
import { Card, Typography } from "antd";
import { Sender } from "@ant-design/x";
import { RobotOutlined } from "@ant-design/icons";
import styles from "./Welcome.module.css";

const { Title, Text } = Typography;

interface WelcomeProps {
  isLoading: boolean;
  selectedApp: string;
  userId: string;
  onSendMessage: (message: string) => void;
}

export const WelcomeComponent: React.FC<WelcomeProps> = ({
  isLoading,
  selectedApp,
  userId,
  onSendMessage,
}) => {
  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading || !selectedApp || !userId) return;

    // 直接调用父组件传入的onSendMessage函数
    onSendMessage(value);
  };

  return (
    <div className={styles.welcome}>
      <Card className={styles.welcomeCard} variant="borderless">
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeTitle}>
            <RobotOutlined className={styles.robotIcon} />
            <Title level={3} className={styles.titleText}>
              今天有什么能帮你？
            </Title>
          </div>
          <Text type="secondary" className={styles.welcomeDesc}>
            欢迎使用 AI Chat Web，请输入您的问题开始对话
          </Text>
        </div>
      </Card>

      <div className={styles.senderContainer}>
        <Sender
          onSubmit={handleSubmit}
          placeholder="请输入您的问题..."
          disabled={isLoading || !selectedApp || !userId}
        />
      </div>
    </div>
  );
};
