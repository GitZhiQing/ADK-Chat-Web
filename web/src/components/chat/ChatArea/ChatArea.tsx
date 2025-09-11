import React, { useRef, useState, useEffect } from 'react';
import { Sender } from '@ant-design/x';
import { Card, Button, Typography, Collapse } from 'antd';
import { CopyOutlined, CheckOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import markdownit from 'markdown-it';
import { useChat } from '../../../contexts/ChatContext';
import styles from './ChatArea.module.css';

const md = markdownit({ html: true, breaks: true });
const { Panel } = Collapse;

interface ChatAreaProps {
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

// 消息内容组件
interface MessagePart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
  codeExecutionResult?: {
    status?: string;
    result?: string;
    logs?: string;
  };
}

const MessageContent: React.FC<{ part: MessagePart }> = ({ part }) => {
  if (part.text) {
    return (
      <div className={styles.messageText}>
        <Typography>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
          <div dangerouslySetInnerHTML={{ __html: md.render(part.text) }} />
        </Typography>
      </div>
    );
  }

  if (part.functionCall) {
    return (
      <Collapse
        ghost
        bordered={false}
        className={styles.collapse}
        defaultActiveKey={[]} // 默认折叠
      >
        <Panel
          header={
            <span className={`${styles.collapseHeader} ${styles.functionCallHeader}`}>
              工具调用: {part.functionCall.name}
            </span>
          }
          key="functionCall"
          className={styles.collapsePanel}
        >
          <pre className={styles.cardPre}>{JSON.stringify(part.functionCall.args, null, 2)}</pre>
        </Panel>
      </Collapse>
    );
  }

  if (part.functionResponse) {
    return (
      <Collapse
        ghost
        bordered={false}
        className={styles.collapse}
        defaultActiveKey={[]} // 默认折叠
      >
        <Panel
          header={
            <span className={`${styles.collapseHeader} ${styles.functionResponseHeader}`}>
              工具响应: {part.functionResponse.name}
            </span>
          }
          key="functionResponse"
          className={styles.collapsePanel}
        >
          <pre className={styles.cardPre}>
            {JSON.stringify(part.functionResponse.response, null, 2)}
          </pre>
        </Panel>
      </Collapse>
    );
  }

  if (part.codeExecutionResult) {
    return (
      <Collapse
        ghost
        bordered={false}
        className={styles.collapse}
        defaultActiveKey={[]} // 默认折叠
      >
        <Panel
          header={
            <span className={`${styles.collapseHeader} ${styles.codeExecutionHeader}`}>
              代码执行结果
            </span>
          }
          key="codeExecution"
          className={styles.collapsePanel}
        >
          <Card size="small" className={styles.card}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>状态:</strong> {part.codeExecutionResult.status || '未知'}
            </p>
            {part.codeExecutionResult.result && (
              <pre className={styles.cardPre}>{part.codeExecutionResult.result}</pre>
            )}
            {part.codeExecutionResult.logs && (
              <details>
                <summary>执行日志</summary>
                <pre className={styles.cardPre}>{part.codeExecutionResult.logs}</pre>
              </details>
            )}
          </Card>
        </Panel>
      </Collapse>
    );
  }

  // 未知内容类型
  return (
    <Collapse
      ghost
      bordered={false}
      className={styles.collapse}
      defaultActiveKey={[]} // 默认折叠
    >
      <Panel
        header={
          <span className={`${styles.collapseHeader} ${styles.unknownHeader}`}>未知内容类型</span>
        }
        key="unknown"
        className={styles.collapsePanel}
      >
        <pre className={styles.cardPre}>{JSON.stringify(part, null, 2)}</pre>
      </Panel>
    </Collapse>
  );
};

export const ChatArea: React.FC<ChatAreaProps> = ({ isLoading, onSendMessage }) => {
  const { messages } = useChat();
  const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const senderRef = useRef<any>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Copy message to clipboard
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(prev => ({ ...prev, [messageId]: true }));
      setTimeout(() => {
        setIsCopied(prev => ({ ...prev, [messageId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Render message content based on type
  interface Message {
    id: string;
    author: string;
    timestamp: number;
    content?: {
      parts: MessagePart[];
    };
  }

  const renderMessageContent = (message: Message) => {
    return message.content?.parts.map((part, index) => <MessageContent key={index} part={part} />);
  };

  // Get text content for copying
  const getMessageContentForCopying = (message: Message) => {
    let content = '';

    message.content?.parts.forEach(part => {
      if (part.text) {
        content += part.text + '\n';
      } else if (part.functionCall) {
        content += `工具调用:\n名称: ${
          part.functionCall.name
        }\n参数: ${JSON.stringify(part.functionCall.args, null, 2)}\n`;
      } else if (part.functionResponse) {
        content += `工具响应:\n名称: ${
          part.functionResponse.name
        }\n响应: ${JSON.stringify(part.functionResponse.response, null, 2)}\n`;
      } else if (part.codeExecutionResult) {
        content += `代码执行结果:\n状态: ${part.codeExecutionResult.status || '未知'}\n`;
        if (part.codeExecutionResult.result) {
          content += `结果: ${part.codeExecutionResult.result}\n`;
        }
        if (part.codeExecutionResult.logs) {
          content += `日志: ${part.codeExecutionResult.logs}\n`;
        }
      } else {
        content += `未知内容类型: ${JSON.stringify(part, null, 2)}\n`;
      }
    });

    return content.trim();
  };

  return (
    <>
      <div className={styles.messagesContainer}>
        {messages.map(message => (
          <div
            key={message.id}
            className={`${styles.messageItem} ${
              message.author === 'user' ? styles.userMessage : styles.agentMessage
            }`}
          >
            <div className={styles.messageAvatar}>
              {message.author === 'user' ? <UserOutlined /> : <RobotOutlined />}
            </div>
            <div className={styles.messageContent}>
              {renderMessageContent(message)}
              <div className={styles.messageFooter}>
                <Button
                  type="text"
                  icon={isCopied[message.id] ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => copyToClipboard(getMessageContentForCopying(message), message.id)}
                  title={isCopied[message.id] ? '已复制!' : '复制消息'}
                  className={styles.copyBtn}
                />
                <span className={styles.messageTime}>
                  {new Date(message.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.senderContainer}>
        <Sender
          ref={senderRef}
          value={inputValue}
          onChange={(value: string) => setInputValue(value)}
          onSubmit={async (value: string) => {
            // Simulate sending message
            await new Promise(resolve => setTimeout(resolve, 100));
            onSendMessage(value);
            // 清除输入框内容
            setInputValue('');
          }}
          placeholder="今天你想问什么... (Enter 发送/Shift+Enter 换行)"
          disabled={isLoading}
        />
        <p>内容由 AI 生成，请仔细甄别</p>
      </div>
    </>
  );
};
