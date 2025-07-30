import React, { memo, useCallback, useRef, useLayoutEffect } from 'react';
import { Search, Users, MessageCircle, RefreshCw } from 'lucide-react';
import type { GuestConversation } from '@/hooks/useGuestConversations';

interface GuestConversationListProps {
  conversations: GuestConversation[];
  selectedConversation: GuestConversation | null;
  onSelectConversation: (conversation: GuestConversation) => void;
  loading: boolean;
  totalCount: number;
  onRefresh?: () => void;
}

// Memoized conversation item component
const GuestConversationItem = memo(({ 
  conversation, 
  isSelected, 
  onClick 
}: {
  conversation: GuestConversation;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const formatTime = useCallback((timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  }, []);

  return (
    <div
      onClick={onClick}
      className={`
        p-3 cursor-pointer rounded-lg transition-all duration-200 mb-2 border
        ${isSelected 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
        ${conversation.unreadCount > 0 ? 'ring-2 ring-red-100 bg-red-50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {conversation.name.charAt(0).toUpperCase()}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                {conversation.name}
              </h3>
              <span className="text-xs" title="Khách tư vấn">
                🧑‍💻
              </span>
            </div>
            {conversation.lastMessageAt && (
              <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                {formatTime(conversation.lastMessageAt)}
              </span>
            )}
          </div>

          {/* Guest ID */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
              Khách tư vấn
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {conversation.guestId.slice(0, 8)}...
            </span>
          </div>

          {/* Last message */}
          {conversation.lastMessage ? (
            <div className="text-sm text-gray-600 truncate">
              <span className="font-medium">
                {conversation.lastMessage.senderId === conversation.guestId ? 'Khách: ' : 'Bạn: '}
              </span>
              {conversation.lastMessage.message}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              Chưa có cuộc trò chuyện nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

GuestConversationItem.displayName = 'GuestConversationItem';

export const GuestConversationList: React.FC<GuestConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  totalCount,
  onRefresh
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef<number>(0);
  const conversationIds = useRef<Set<string>>(new Set());

  // Save scroll position before re-render
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      savedScrollTop.current = container.scrollTop;
    }
  });

  // Restore scroll position after re-render
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container && savedScrollTop.current > 0) {
      // Check if this is just an update (not new conversations)
      const currentIds = new Set(conversations.map(c => c.guestId));
      const hasNewConversations = conversations.some(c => !conversationIds.current.has(c.guestId));
      
      if (!hasNewConversations) {
        // Restore scroll position for updates
        container.scrollTop = savedScrollTop.current;
      }
      
      // Update stored conversation IDs
      conversationIds.current = currentIds;
    }
  }, [conversations]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      savedScrollTop.current = scrollContainerRef.current.scrollTop;
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Khách tư vấn</h2>
          <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            {totalCount}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khách tư vấn..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="text-xs text-gray-500">
          Hiển thị tất cả khách tư vấn
        </div>
      </div>

      {/* Conversation List */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3"
        style={{ scrollBehavior: 'auto' }}
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm">Đang tải...</span>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có khách tư vấn nào</p>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách khách sẽ xuất hiện khi có khách truy cập
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {conversations.map((conversation) => (
              <GuestConversationItem
                key={`conversation-${conversation.guestId}`}
                conversation={conversation}
                isSelected={selectedConversation?.guestId === conversation.guestId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};