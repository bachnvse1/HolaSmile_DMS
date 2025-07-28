import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Search, Filter, Users, MessageCircle } from 'lucide-react';
import type { ConversationUser, ConversationFilters } from '@/hooks/useChatConversations';

interface ConversationListProps {
  conversations: ConversationUser[];
  selectedConversation: ConversationUser | null;
  onSelectConversation: (conversation: ConversationUser) => void;
  filters: ConversationFilters;
  onUpdateFilters: (filters: Partial<ConversationFilters>) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  totalCount: number;
  showFilters?: boolean; // Add optional filter control
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

  // const getRoleIcon = (role: string) => {
  //   switch (role) {
  //     case 'Patient': return '🧑‍💼';
  //     case 'Dentist': return '🦷';
  //     case 'Administrator':
  //     case 'Owner': return '👑';
  //     default: return '👥';
  //   }
  // };

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
          <img
            src={conversation.avatarUrl || "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
            alt={conversation.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
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
                {conversation.fullName}
              </h3>
              {/* <span className="text-xs" title={getRoleLabel(conversation.role)}>
                {getRoleIcon(conversation.role)}
              </span> */}
            </div>
            {conversation.lastMessageTime && (
              <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                {formatTime(conversation.lastMessageTime)}
              </span>
            )}
          </div>

          {/* Role and phone */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {getRoleLabel(conversation.role)}
            </span>
            <span className="text-xs text-gray-500">{conversation.phone}</span>
          </div>

          {/* Last message */}
          {conversation.lastMessage ? (
            <div className="text-sm text-gray-600 truncate">
              <span className="font-medium">
                {conversation.lastMessage.senderId !== conversation.userId ? 'Bạn: ' : ''}
              </span>
              {conversation.lastMessage.message}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              Chưa có tin nhắn
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  filters,
  onUpdateFilters,
  onLoadMore,
  hasMore,
  loading,
  totalCount,
  showFilters = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Tin nhắn</h2>
          <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            {totalCount}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            value={filters.searchTerm}
            onChange={(e) => onUpdateFilters({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters - Only show if enabled */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.roleFilter}
                onChange={(e) => onUpdateFilters({ roleFilter: e.target.value as ConversationFilters['roleFilter'] })}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                title="Lọc theo vai trò"
              >
                <option value="all">Tất cả</option>
                <option value="Patient">Bệnh nhân</option>
                <option value="Dentist">Nha sĩ</option>
                <option value="staff">Nhân viên</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 max-h-[calc(100vh-200px)]"
      >
        {conversations.length === 0 && !loading ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Không tìm thấy cuộc hội thoại nào</p>
          </div>
        ) : (
          <>
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.userId}
                conversation={conversation}
                isSelected={selectedConversation?.userId === conversation.userId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Đang tải...</span>
                </div>
              </div>
            )}
            
            {/* Load more button */}
            {hasMore && !loading && (
              <div className="text-center py-4">
                <button
                  onClick={onLoadMore}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Tải thêm
                </button>
              </div>
            )}
            
            {/* End of list */}
            {!hasMore && conversations.length > 0 && (
              <div className="text-center py-4">
                <span className="text-sm text-gray-500">Đã hiển thị tất cả</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};