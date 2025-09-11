import React, { useRef, useState, useEffect } from 'react';
import { Sender } from '@ant-design/x';
import { Card, Button, Typography, Collapse, Flex, message, theme } from 'antd';
import {
  CopyOutlined,
  CheckOutlined,
  UserOutlined,
  RobotOutlined,
  LinkOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import markdownit from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.min.css';
import { useChat } from '../../../contexts/ChatContext';
import styles from './ChatArea.module.css';

const md = markdownit({
  html: true,
  breaks: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (err) {
        console.error('Highlighting failed:', err);
      }
    }

    // 如果没有指定语言或高亮失败，返回转义后的文本
    const mdInstance = markdownit();
    return mdInstance.utils.escapeHtml(str);
  },
});

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
        <Typography style={{ fontSize: '17px', lineHeight: '1.6' }}>
          <div dangerouslySetInnerHTML={{ __html: md.render(part.text) }} />
        </Typography>
      </div>
    );
  }

  if (part.functionCall) {
    // 将JSON对象转换为格式化的字符串，然后用Markdown渲染以获得语法高亮
    const jsonString = JSON.stringify(part.functionCall.args, null, 2);
    return (
      <Collapse
        ghost
        bordered={false}
        className={styles.collapse}
        defaultActiveKey={[]} // 默认折叠
        items={[
          {
            key: 'functionCall',
            label: (
              <span className={`${styles.collapseHeader}`}>
                [工具调用] {part.functionCall.name}
              </span>
            ),
            children: (
              <div
                dangerouslySetInnerHTML={{
                  __html: md.render(`\`\`\`json\n${jsonString}\n\`\`\``),
                }}
                className={styles.messageData}
              />
            ),
            className: styles.collapsePanel,
          },
        ]}
      />
    );
  }

  if (part.functionResponse) {
    // 将JSON对象转换为格式化的字符串，然后用Markdown渲染以获得语法高亮
    const jsonString = JSON.stringify(part.functionResponse.response, null, 2);
    return (
      <Collapse
        ghost
        bordered={false}
        className={styles.collapse}
        defaultActiveKey={[]} // 默认折叠
        items={[
          {
            key: 'functionResponse',
            label: (
              <span className={`${styles.collapseHeader}`}>
                [工具响应] {part.functionResponse.name}
              </span>
            ),
            children: (
              <div
                dangerouslySetInnerHTML={{
                  __html: md.render(`\`\`\`json\n${jsonString}\n\`\`\``),
                }}
                className={styles.messageData}
              />
            ),
            className: styles.collapsePanel,
          },
        ]}
      />
    );
  }

  if (part.codeExecutionResult) {
    return (
      <Collapse
        ghost
        bordered={false}
        className={styles.collapse}
        defaultActiveKey={[]} // 默认折叠
        items={[
          {
            key: 'codeExecution',
            label: <span className={`${styles.collapseHeader}`}>代码执行结果</span>,
            children: (
              <Card size="small" className={styles.card}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>状态:</strong> {part.codeExecutionResult.status || '未知'}
                </p>
                {part.codeExecutionResult.result && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: md.render(`\`\`\`json\n${part.codeExecutionResult.result}\n\`\`\``),
                    }}
                    className={styles.messageData}
                  />
                )}
                {part.codeExecutionResult.logs && (
                  <details>
                    <summary>执行日志</summary>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: md.render(`\`\`\`json\n${part.codeExecutionResult.result}\n\`\`\``),
                      }}
                      className={styles.messageData}
                    />
                  </details>
                )}
              </Card>
            ),
            className: styles.collapsePanel,
          },
        ]}
      />
    );
  }

  // 未知内容类型
  const jsonString = JSON.stringify(part, null, 2);
  return (
    <Collapse
      ghost
      bordered={false}
      className={styles.collapse}
      defaultActiveKey={[]} // 默认折叠
      items={[
        {
          key: 'unknown',
          label: <span className={`${styles.collapseHeader} `}>未知内容类型</span>,
          children: (
            <div
              dangerouslySetInnerHTML={{
                __html: md.render(`\`\`\`json\n${jsonString}\n\`\`\``),
              }}
              className={styles.messageData}
            />
          ),
          className: styles.collapsePanel,
        },
      ]}
    />
  );
};

export const ChatArea: React.FC<ChatAreaProps> = ({ isLoading, onSendMessage }) => {
  const { messages } = useChat();
  const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const senderRef = useRef(null);

  // 当消息更新时，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 复制消息到剪贴板
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

  // 获取消息内容的纯文本表示，便于复制
  const getMessageContentForCopying = (message: Message) => {
    let content = '';

    message.content?.parts.forEach(part => {
      if (part.text) {
        content += part.text + '\n';
      } else if (part.functionCall) {
        content += `[工具调用] ${
          part.functionCall.name
        }\n${JSON.stringify(part.functionCall.args, null, 2)}\n`;
      } else if (part.functionResponse) {
        content += `[工具响应] ${
          part.functionResponse.name
        }\n${JSON.stringify(part.functionResponse.response, null, 2)}\n`;
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
  const [open, setOpen] = React.useState(false);
  const { token } = theme.useToken();

  const headerNode = (
    <Sender.Header title="上传文件" open={open} onOpenChange={setOpen}>
      <Flex vertical align="center" gap="small" style={{ marginBlock: token.paddingLG }}>
        <CloudUploadOutlined style={{ fontSize: '4em' }} />
        <Typography.Title level={5} style={{ margin: 0 }}>
          将文件拖到此处
        </Typography.Title>
        <Typography.Text type="secondary">支持 docx 格式</Typography.Text>
        <Button
          onClick={() => {
            message.info('Mock select file');
          }}
        >
          选择文件
        </Button>
      </Flex>
    </Sender.Header>
  );

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
        <Flex align="end">
          <Sender
            header={headerNode}
            prefix={
              <Button
                type="text"
                icon={<LinkOutlined />}
                onClick={() => {
                  setOpen(!open);
                }}
              />
            }
            ref={senderRef}
            value={inputValue}
            onChange={(value: string) => setInputValue(value)}
            onSubmit={async (value: string) => {
              await new Promise(resolve => setTimeout(resolve, 100));
              onSendMessage(value);
              // 清除输入框内容
              setInputValue('');
            }}
            placeholder="今天你想问什么... (Enter 发送/Shift+Enter 换行)"
            disabled={isLoading}
          />
        </Flex>
        <p>内容由 AI 生成，请仔细甄别</p>
      </div>
    </>
  );
};
