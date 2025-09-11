import React from 'react';
import { Layout, Typography, Select, Input, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAppManager } from '../../hooks/useAppManager';
import styles from '../../styles/global.module.css';
import { RobotOutlined } from '@ant-design/icons';
const { Header } = Layout;

interface AppBarProps {
  showControls?: boolean;
  onReload?: () => void;
}

export const AppBar: React.FC<AppBarProps> = ({ showControls = true, onReload }) => {
  const { apps, selectedApp, userId, setSelectedApp, setUserId, loadApps } = useAppManager();

  // 初始化时加载应用列表
  React.useEffect(() => {
    loadApps();
  }, [loadApps]);

  return (
    <Header className={styles.header}>
      <div className={styles.headerLeft}>
        <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-primary)' }}>
          <RobotOutlined style={{ color: 'var(--primary)' }} />
          <span style={{ marginLeft: 8 }}>Agent Chat Web</span>
        </Typography.Title>
      </div>
      {showControls && (
        <div className={styles.headerRight}>
          <Space size="middle">
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>应用:</span>
              <Select
                value={selectedApp}
                onChange={setSelectedApp}
                className={styles.controlSelect}
                options={apps.map(app => ({ label: app, value: app }))}
              />
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>用户ID:</span>
              <Input
                placeholder="输入用户ID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className={styles.controlInput}
                prefix={<UserOutlined />}
              />
            </div>

            {onReload && (
              <Button type="primary" onClick={onReload} disabled={!selectedApp || !userId}>
                加载会话
              </Button>
            )}
          </Space>
        </div>
      )}
    </Header>
  );
};
