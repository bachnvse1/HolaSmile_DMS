import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Send, MoreVertical, Phone, Video, Info, Paperclip, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from '@/components/chatbox/ChatHubProvider';
import type { ConversationUser } from '@/hooks/useChatConversations';
import type { ChatMessage } from '@/hooks/useChatConversations';

interface ChatWindowProps {
  conversation: ConversationUser | null;
  onBack?: () => void;
}

// Memoized message item component
const MessageItem = memo(({
  message,
  isMine,
  // showAvatar = false,
  conversationUser
}: {
  message: ChatMessage;
  isMine: boolean;
  showAvatar?: boolean;
  conversationUser?: ConversationUser | null;
}) => {
  const formatTime = useCallback((timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className={`flex gap-2 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {/* {!isMine && showAvatar && (
        <img
          src={"https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      )} */}

      <div className={`max-w-[70%] ${isMine ? 'order-last' : ''}`}>
        <div
          className={`
            rounded-2xl px-4 py-2 text-sm
            ${isMine
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
          `}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.message}
          </p>
        </div>

        <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {isMine && (
            <div className="flex items-center gap-1">
              {message.isDelivered ? (
                message.isRead ? (
                  <div className="flex items-center gap-1" title="Đã xem">
                    <img
                      src={conversationUser?.avatarUrl || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
                      alt="Seen"
                      className="w-3 h-3 rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div title="Đã gửi">
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  </div>
                )
              ) : (
                <div title="Đang gửi">
                  <Check className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* {isMine && showAvatar && (
        <img
          src={"https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
          alt="Avatar"
          className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0"
        />
      )} */}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// Memoized message date separator
const DateSeparator = memo(({ date }: { date: string }) => {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }, []);

  return (
    <div className="flex justify-center my-4">
      <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
        {formatDate(date)}
      </span>
    </div>
  );
});

DateSeparator.displayName = 'DateSeparator';

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBack
}) => {
  const { userId } = useAuth();
  const {
    messages: realtimeMessages,
    sendMessage,
    fetchChatHistory
  } = useChatHub();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const MESSAGES_PER_PAGE = 15;

  // Load conversation history
  useEffect(() => {
    if (!conversation || !userId) {
      setHistory([]);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    fetchChatHistory(userId, conversation.userId)
      .then(data => {
        if (!isCancelled) {
          setHistory(Array.isArray(data) ? data : []);
        }
      })
      .catch(err => {
        console.error('Error loading history:', err);
        if (!isCancelled) {
          setHistory([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [conversation, userId, fetchChatHistory]);

  // Combine and process all messages
  const allMessages = useMemo(() => {
    if (!conversation || !userId) return [];

    const conversationMessages = [
      ...history,
      ...realtimeMessages.filter(msg =>
        (msg.senderId === userId && msg.receiverId === conversation.userId) ||
        (msg.senderId === conversation.userId && msg.receiverId === userId)
      )
    ];

    // Remove duplicates
    const uniqueMessages = conversationMessages.filter((msg, index, arr) =>
      arr.findIndex(m =>
        m.senderId === msg.senderId &&
        m.receiverId === msg.receiverId &&
        m.message === msg.message &&
        Math.abs(new Date(m.timestamp || '').getTime() - new Date(msg.timestamp || '').getTime()) < 1000
      ) === index
    );

    // Sort by timestamp
    return uniqueMessages.sort((a, b) =>
      new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
    );
  }, [history, realtimeMessages, conversation, userId]);

  // Paginate messages - show only recent messages initially
  const displayedMessages = useMemo(() => {
    const messagesCount = allMessages.length;
    const startIndex = Math.max(0, messagesCount - MESSAGES_PER_PAGE * (historyPage + 1));
    return allMessages.slice(startIndex);
  }, [allMessages, historyPage, MESSAGES_PER_PAGE]);

  // Group displayed messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];

    displayedMessages.forEach(message => {
      const messageDate = new Date(message.timestamp || '').toDateString();

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [displayedMessages]);

  // Handle scroll to load more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && !loadingMore && hasMoreHistory) {
      setLoadingMore(true);
      setTimeout(() => {
        setHistoryPage(prev => prev + 1);
        setLoadingMore(false);
      }, 500);
    }
  }, [loadingMore, hasMoreHistory]);

  // Check if there are more messages to load
  useEffect(() => {
    const totalMessages = allMessages.length;
    const displayedCount = MESSAGES_PER_PAGE * (historyPage + 1);
    setHasMoreHistory(totalMessages > displayedCount);
  }, [allMessages.length, historyPage, MESSAGES_PER_PAGE]);

  // Auto scroll to bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(timer);
  }, [allMessages.length]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !conversation || !sendMessage) return;

    sendMessage(conversation.userId, trimmedInput);
    setInput('');

    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [input, conversation, sendMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle input change with auto-resize
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chọn một cuộc hội thoại
          </h3>
          <p className="text-gray-500">
            Chọn người dùng từ danh sách bên trái để bắt đầu nhắn tin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ←
              </button>
            )}

            <img
              src={conversation.avatarUrl || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
              alt={conversation.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div>
              <h2 className="font-semibold text-gray-900">
                {conversation.fullName}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.role === 'Patient' ? 'Bệnh nhân' :
                  conversation.role === 'Dentist' ? 'Nha sĩ' :
                    conversation.role}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {/* <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Gọi điện"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Gọi video"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Thông tin"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Tùy chọn khác"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div> */}
        </div>
      </div>

      {/* Messages - Take remaining space */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 min-h-0"
      >
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có tin nhắn
            </h3>
            <p className="text-gray-500">
              Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc hội thoại
            </p>
          </div>
        ) : (
          <>
            {/* Load more indicator */}
            {loadingMore && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Đang tải tin nhắn cũ...</span>
                </div>
              </div>
            )}

            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                <DateSeparator date={group.date} />
                {group.messages.map((message, messageIndex) => {
                  const isMine = message.senderId === userId;
                  const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                  const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

                  return (
                    <MessageItem
                      key={message.messageId || `${message.senderId}-${message.timestamp}-${messageIndex}`}
                      message={message}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      conversationUser={conversation}
                    />
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - Always at bottom */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-end gap-3">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 self-end"
            title="Đính kèm file"
            style={{ height: 48 }}
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 relative flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
              rows={1}
              style={{ minHeight: 48, lineHeight: '24px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`
        p-3 rounded-full transition-all flex-shrink-0 self-end
        ${input.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
      `}
            style={{ height: 48, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};