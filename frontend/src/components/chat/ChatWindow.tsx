import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Send, MoreVertical, Phone, Video, Info, Paperclip, MessageCircle, Check, CheckCheck, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from '@/components/chat/ChatHubProvider';
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

  // Load conversation history - CHỈ 1 LẦN khi conversation thay đổi
  useEffect(() => {
    if (!conversation || !userId) {
      setHistory([]);
      return;
    }

    // Reset states when conversation changes
    setHistory([]);
    setHistoryPage(0);
    setHasMoreHistory(true);

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
  }, [conversation?.userId, userId]);

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
    const messageMap = new Map();
    conversationMessages.forEach(msg => {
      const key = `${msg.senderId}-${msg.receiverId}-${msg.message}-${Math.floor(new Date(msg.timestamp || '').getTime() / 1000)}`;
      if (!messageMap.has(key) || (msg.messageId && !messageMap.get(key).messageId)) {
        messageMap.set(key, msg);
      }
    });

    return Array.from(messageMap.values()).sort((a, b) =>
      new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
    );
  }, [history, realtimeMessages, conversation?.userId, userId]);

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

  // Handle scroll - LOẠI BỎ auto scroll logic hoàn toàn
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    
    // Chỉ load more messages khi scroll to top
    if (scrollTop === 0 && !loadingMore && hasMoreHistory) {
      setLoadingMore(true);
      setTimeout(() => {
        setHistoryPage(prev => prev + 1);
        setLoadingMore(false);
      }, 500);
    }
  }, [loadingMore, hasMoreHistory]);

  // LOẠI BỎ hoàn toàn auto scroll useEffect

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

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chọn cuộc trò chuyện
          </h3>
          <p className="text-gray-500">
            Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="relative">
              {conversation.avatarUrl ? (
                <img
                  src={conversation.avatarUrl}
                  alt={conversation.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {conversation.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">{conversation.fullName}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="capitalize">{conversation.role}</span>
                {conversation.phone && (
                  <>
                    <span>•</span>
                    <span>{conversation.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Tìm kiếm">
            <Search className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Thông tin">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Container - LOẠI BỎ auto scroll */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Đang tải tin nhắn...</span>
            </div>
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có tin nhắn nào</p>
            <p className="text-sm text-gray-500 mt-1">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs">Đang tải thêm...</span>
                </div>
              </div>
            )}

            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                <DateSeparator date={group.date} />
                <div className="space-y-2">
                  {group.messages.map((message, messageIndex) => (
                    <MessageItem
                      key={`${groupIndex}-${messageIndex}`}
                      message={message}
                      isMine={message.senderId === userId}
                      conversationUser={conversation}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        
        {/* Scroll anchor - không auto scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-2 rounded-full transition-colors ${
              input.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};