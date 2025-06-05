import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatStream } from '../api/api';

export default function AIChatAssistant({
  endpoint = "stock",
  contextId,
  initialMessage,
  placeholder = "输入您的问题...",
  disabled = false,
  disabledPlaceholder = "请先选择相关项目",
  title = "AI 分析助手",
  subtitle = "DeepSeek 驱动",
  className = "",
  style = {} 
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // 聊天助手状态
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 颜色定义
  const colors = {
    // 背景色
    primary: isDark ? "bg-gray-950" : "bg-gray-50",
    secondary: isDark ? "bg-gray-900" : "bg-white",
    tertiary: isDark ? "bg-gray-800" : "bg-gray-100",
    quaternary: isDark ? "bg-gray-700" : "bg-gray-50",

    // 文字色
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    textDisabled: isDark ? "text-gray-600" : "text-gray-400",

    // 边框色
    border: isDark ? "border-gray-700" : "border-gray-200",
    borderLight: isDark ? "border-gray-800" : "border-gray-100",
    borderStrong: isDark ? "border-gray-600" : "border-gray-300",

    // 强调色
    accent: isDark ? "bg-blue-600" : "bg-blue-600",
    accentHover: isDark ? "hover:bg-blue-500" : "hover:bg-blue-700",
    accentLight: isDark ? "bg-blue-900/30" : "bg-blue-50",
    accentText: isDark ? "text-blue-400" : "text-blue-600",

    // 状态色
    success: isDark ? "text-emerald-400" : "text-emerald-600",
    successBg: isDark ? "bg-emerald-900/30" : "bg-emerald-50",
    danger: isDark ? "text-red-400" : "text-red-600",
    dangerBg: isDark ? "bg-red-900/30" : "bg-red-50",
    warning: isDark ? "text-amber-400" : "text-amber-600",
    warningBg: isDark ? "bg-amber-900/30" : "bg-amber-50",

    // 阴影
    shadow: isDark
      ? "shadow-lg shadow-black/25"
      : "shadow-lg shadow-gray-400/25",
    shadowStrong: isDark
      ? "shadow-xl shadow-black/40"
      : "shadow-xl shadow-gray-500/30",
  };

  // 当contextId或initialMessage变化时重置消息
  useEffect(() => {
    if (contextId && initialMessage) {
      setMessages([{ role: 'ai', content: initialMessage }]);
    } else if (contextId) {
      setMessages([]);
    } else {
      setMessages([]);
    }
  }, [contextId, initialMessage]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息处理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || disabled) return;
    
    const userMessage = { role: 'user', content: inputValue };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    // 添加空的AI消息
    setMessages(prev => [...prev, { role: 'ai', content: '' }]);
    const aiMessageIndex = currentHistory.length;
    let aiText = '';

    try {
      // 准备聊天历史
      const trimmedHistory = currentHistory
        .filter(msg => msg.role === 'user' || msg.role === 'ai')
        .slice(-6)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

      // 使用新的流式API
      await sendChatStream({
        message: currentInputValue,
        history: trimmedHistory.slice(0, -1),
        stock_id: contextId,
        endpoint: endpoint,
        onChunk: (chunk) => {
          aiText += chunk;
          setMessages(prev => {
            const updated = [...prev];
            if (updated[aiMessageIndex] && updated[aiMessageIndex].role === 'ai') {
              updated[aiMessageIndex].content = aiText;
            }
            return updated;
          });
        },
        onError: (error) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'ai' && lastMessage.content === '') {
              lastMessage.content = '发生错误: ' + error.message;
            } else {
              updated.push({ role: 'ai', content: '发生错误: ' + error.message });
            }
            return updated;
          });
        },
        onComplete: () => {
          // 流式传输完成
        }
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage && lastMessage.role === 'ai' && lastMessage.content === '') {
          lastMessage.content = '发生错误: ' + err.message;
        } else {
          updated.push({ role: 'ai', content: '发生错误: ' + err.message });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 键盘事件处理
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className={`${colors.tertiary} flex flex-col h-full transition-all duration-200 ${className}`}
      style={style}
    >
      {/* 标题栏 */}
      <div className={`${colors.borderStrong} border-b p-6 ${colors.secondary} flex-shrink-0`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${colors.accent} rounded-lg flex items-center justify-center ${colors.shadow}`}>
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className={`text-lg font-bold ${colors.textPrimary}`}>
              {title}
            </h2>
            <p className={`${colors.textMuted} text-xs`}>{subtitle}</p>
          </div>
        </div>
      </div>

      {/* 消息展示区域 */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-4">
          {messages.map((msg, index) =>
            msg.role === "user" ? (
              <div key={index} className="flex justify-end">
                <div className={`${colors.accent} text-white px-4 py-3 rounded-lg rounded-br-sm max-w-[85%] ${colors.shadow}`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ) : (
              <div key={index} className="flex justify-start">
                <div className={`${colors.secondary} ${colors.border} border px-4 py-3 rounded-lg rounded-bl-sm max-w-[85%] ${colors.shadow}`}>
                  <div
                    className={`prose prose-sm max-w-none ${
                      isDark ? "prose-invert" : ""
                    } ${colors.textPrimary} 
                                prose-headings:${colors.textPrimary} prose-p:${colors.textSecondary} prose-strong:${colors.textPrimary} 
                                prose-code:${colors.accentText} prose-code:bg-black/10 prose-code:p-1 prose-code:rounded-md
                                prose-a:${colors.accentText} hover:prose-a:underline 
                                prose-ul:${colors.textSecondary} prose-ol:${colors.textSecondary} 
                                prose-li:${colors.textSecondary} prose-li::marker:${colors.textMuted}
                                dark:prose-code:bg-white/10`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || "分析中"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          )}

          {/* 加载状态 */}
          {isLoading && (!messages[messages.length-1] || messages[messages.length-1]?.role !== 'ai' || messages[messages.length-1]?.content === '') && (
            <div className="flex justify-start">
              <div className={`${colors.secondary} ${colors.border} border px-4 py-3 rounded-lg rounded-bl-sm ${colors.shadow}`}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className={`${colors.borderStrong} border-t p-4 ${colors.secondary}`}>
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? disabledPlaceholder : placeholder}
              className={`w-full ${colors.quaternary} ${colors.borderStrong} border ${colors.textPrimary} placeholder:${colors.textMuted} px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all max-h-32`}
              rows={1}
              disabled={isLoading || disabled}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || disabled}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isLoading || !inputValue.trim() || disabled
                ? `${colors.quaternary} ${colors.textDisabled} cursor-not-allowed`
                : `${colors.accent} ${colors.accentHover} text-white ${colors.shadow} hover:scale-105 active:scale-95`
            }`}
            title="发送消息"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}