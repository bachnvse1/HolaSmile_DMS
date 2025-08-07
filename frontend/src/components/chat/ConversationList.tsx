import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Search, Filter, Users, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';
import type { ConversationUser, ConversationFilters } from '@/hooks/chat/useChatConversations';

interface ConversationListProps {
  conversations: ConversationUser[];
  selectedConversation: ConversationUser | null;
  onSelectConversation: (conversation: ConversationUser) => void;
  filters: ConversationFilters;
  onFiltersChange: (filters: Partial<ConversationFilters>) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  totalCount: number;
  totalUnreadCount?: number;
  showFilters?: boolean;
}

// Memoized conversation item component
const ConversationItem = memo(({ 
  conversation, 
  isSelected, 
  onClick 
}: {
  conversation: ConversationUser;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const formatTime = useCallback((timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 60000) {
      return 'Vừa xong';
    } else if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} phút`;
    } else if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Patient': return 'Bệnh nhân';
      case 'Dentist': return 'Nha sĩ';
      case 'Administrator': return 'Quản trị';
      case 'Owner': return 'Chủ sở hữu';
      case 'Receptionist': return 'Lễ tân';
      case 'Assistant': return 'Trợ lý';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Patient': return 'bg-green-100 text-green-700 border-green-200';
      case 'Dentist': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Owner': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Administrator': return 'bg-red-100 text-red-700 border-red-200';
      case 'Receptionist': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Assistant': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const hasRecentMessage = conversation.lastMessageTime && 
    new Date().getTime() - new Date(conversation.lastMessageTime).getTime() < 300000; // 5 minutes

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 cursor-pointer rounded-xl transition-all duration-300 mb-2 group
        ${isSelected 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md transform scale-[1.02]' 
          : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
        }
        ${conversation.unreadCount > 0 ? 'ring-2 ring-red-100 shadow-lg border-red-200' : ''}
        ${hasRecentMessage ? 'ring-1 ring-green-200 border-green-200' : ''}
      `}
    >
      {/* New message indicator */}
      {hasRecentMessage && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={conversation.avatarUrl || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
            alt={conversation.fullName}
            className={`
              w-12 h-12 rounded-full object-cover transition-all duration-200
              ${isSelected 
                ? 'border-3 border-blue-300 shadow-md' 
                : 'border-2 border-gray-200 group-hover:border-gray-300'
              }
            `}
          />
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <span className="text-xs text-white font-bold">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            </div>
          )}
          {/* Online status indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className={`
                font-semibold truncate transition-colors duration-200
                ${isSelected ? 'text-blue-700' : 'text-gray-900'}
                ${conversation.unreadCount > 0 ? 'text-gray-900' : ''}
              `}>
                {conversation.fullName}
              </h3>
            </div>
            {conversation.lastMessageTime && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className={`h-3 w-3 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`
                  text-xs font-medium
                  ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                  ${hasRecentMessage ? 'text-green-600' : ''}
                `}>
                  {formatTime(conversation.lastMessageTime)}
                </span>
              </div>
            )}
          </div>

          {/* Role and phone */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`
              text-xs px-2 py-1 rounded-lg border font-medium
              ${getRoleColor(conversation.role)}
            `}>
              {getRoleLabel(conversation.role)}
            </span>
            <span className="text-xs text-gray-500 font-medium">{conversation.phone}</span>
          </div>

          {/* Last message */}
          {conversation.lastMessage ? (
            <div className={`
              text-sm truncate transition-colors duration-200
              ${conversation.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-600'}
            `}>
              <span className={`
                ${conversation.lastMessage.senderId !== conversation.userId 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-700'
                }
              `}>
                {conversation.lastMessage.senderId !== conversation.userId ? 'Bạn: ' : ''}
              </span>
              <span className={conversation.unreadCount > 0 ? 'font-medium' : ''}>
                {conversation.lastMessage.message}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Chưa có tin nhắn
            </div>
          )}
        </div>
      </div>

      {/* Unread message highlight bar */}
      {conversation.unreadCount > 0 && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full"></div>
      )}
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  filters,
  onFiltersChange,
  onLoadMore,
  hasMore,
  loading,
  totalCount,
  totalUnreadCount = 0,
  showFilters = false
}) => {
  const { userId } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🔥 Use useUnreadMessages hook to get real-time unread counts
  const { getTotalUnreadCount } = useUnreadMessages(userId);

  // Sort conversations: unread first, then by recent activity, then alphabetically
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      // First priority: unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Second priority: most recent message
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      
      // Third priority: alphabetical by name
      return a.fullName.localeCompare(b.fullName, 'vi');
    });
  }, [conversations]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 🔥 Calculate stats using useUnreadMessages hook instead of conversations prop
  const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;
  const totalUnreadMessages = getTotalUnreadCount(); // Use hook instead of reducing conversations

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Tin nhắn</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{totalCount} cuộc trò chuyện</span>
              {unreadCount > 0 && (
                <span className="text-red-600 font-medium">
                  {unreadCount} tin nhắn mới
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
          />
        </div>

        {/* Filters - Only show if enabled */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.roleFilter}
                onChange={(e) => onFiltersChange({ roleFilter: e.target.value as ConversationFilters['roleFilter'] })}
                className="text-sm border-0 bg-transparent focus:outline-none text-gray-700 font-medium"
                title="Lọc theo vai trò"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="Patient">Bệnh nhân</option>
                <option value="Dentist">Nha sĩ</option>
                <option value="Administrator">Quản trị viên</option>
                <option value="Owner">Chủ sở hữu</option>
                <option value="Receptionist">Lễ tân</option>
                <option value="Assistant">Trợ lý</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-1"
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        {sortedConversations.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Users className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy cuộc trò chuyện</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            {sortedConversations.map((conversation) => (
              <ConversationItem
                key={conversation.userId}
                conversation={conversation}
                isSelected={selectedConversation?.userId === conversation.userId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-3 text-gray-500 bg-white rounded-lg px-4 py-3 shadow-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium">Đang tải thêm...</span>
                </div>
              </div>
            )}
            
            {/* Load more button */}
            {hasMore && !loading && (
              <div className="text-center py-4">
                <button
                  onClick={onLoadMore}
                  className="bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-6 rounded-lg border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Tải thêm cuộc trò chuyện
                </button>
              </div>
            )}
            
            {/* End of list */}
            {!hasMore && sortedConversations.length > 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-gray-500 bg-white rounded-lg px-4 py-2 text-sm">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>Đã hiển thị tất cả {totalCount} cuộc trò chuyện</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};