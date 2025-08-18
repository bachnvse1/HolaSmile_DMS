import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Send, MoreVertical, Paperclip, MessageCircle, Check, CheckCheck, Search, ArrowLeft, Image, Video as VideoIcon, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';
import type { ConversationUser } from '@/hooks/chat/useChatConversations';
import type { ChatMessage } from '@/hooks/chat/useChatConversations';
import axiosInstance from '@/lib/axios';

interface ChatWindowProps {
  conversation: ConversationUser | null;
  onBack?: () => void;
  onMarkAsRead?: (senderId: string, receiverId: string) => void;
}

const getRoleInVietnamese = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'Dentist': 'Nha sĩ',
    'Owner': 'Chủ sở hữu',
    'Administrator': 'Quản trị viên',
    'Assistant': 'Trợ lý',
    'Receptionist': 'Lễ tân',
    'Patient': 'Bệnh nhân'
  };
  
  return roleMap[role] || role;
};

const uploadMedia = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axiosInstance.post('/chats/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });
    return response.data.url;
  } catch (error) {
    console.error('Upload media error:', error);
    throw error;
  }
};

// Memoized message item component
const MessageItem = memo(({
  message,
  isMine,
  messageIndex,
  searchQuery
}: {
  message: ChatMessage;
  isMine: boolean;
  showAvatar?: boolean;
  conversationUser?: ConversationUser | null;
  messageIndex?: number;
  searchQuery?: string;
}) => {
  const formatTime = useCallback((timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const highlightSearchText = useCallback((text: string, search: string) => {
    if (!search || !text) return text;
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span 
            key={index} 
            className="bg-yellow-300 text-yellow-900 font-semibold rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, []);

  const renderMessageContent = useCallback(() => {
    // Kiểm tra nếu message là URL của ảnh/video
    const isImageUrl = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(message.message) || 
                      message.message.includes('/uploads/') && /image/i.test(message.message);
    const isVideoUrl = /\.(mp4|webm|ogg|avi|mov)(\?|$)/i.test(message.message) || 
                      message.message.includes('/uploads/') && /video/i.test(message.message);
    
    if (isImageUrl) {
      return (
        <div className="space-y-2">
          <img 
            src={message.message} 
            alt="Shared image"
            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(message.message, '_blank')}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-xs text-gray-500 p-2 bg-gray-100 rounded';
              fallback.textContent = 'Không thể tải ảnh';
              (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
            }}
          />
          <div className={`flex items-center gap-2 text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
            <Image className="w-3 h-3" />
            <span>Hình ảnh</span>
          </div>
        </div>
      );
    } else if (isVideoUrl) {
      return (
        <div className="space-y-2">
          <video 
            src={message.message} 
            controls
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '200px' }}
            onError={(e) => {
              (e.target as HTMLVideoElement).style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-xs text-gray-500 p-2 bg-gray-100 rounded';
              fallback.textContent = 'Không thể tải video';
              (e.target as HTMLVideoElement).parentNode?.appendChild(fallback);
            }}
          />
          <div className={`flex items-center gap-2 text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
            <VideoIcon className="w-3 h-3" />
            <span>Video</span>
          </div>
        </div>
      );
    }
    
    const messageText = searchQuery && searchQuery.trim() 
      ? highlightSearchText(message.message, searchQuery)
      : message.message;
      
    return <p className="whitespace-pre-wrap break-words">{messageText}</p>;
  }, [message.message, isMine, searchQuery, highlightSearchText]);

  return (
    <div 
      className={`flex gap-2 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
      data-message-index={messageIndex}
    >
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
          {renderMessageContent()}
        </div>

        <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {isMine && (
            <div className="flex items-center gap-1">
              {message.isDelivered ? (
                message.isRead ? (
                  <div title="Đã đọc">
                    <CheckCheck className="w-3 h-3 text-blue-500" />
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
  onBack,
  onMarkAsRead
}) => {
  const { userId } = useAuth();
  
  const { markAsRead } = useUnreadMessages(userId);
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
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const [isUploading, setIsUploading] = useState(false);
  
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false); 
  const [searchMode, setSearchMode] = useState(false); 
  const [searchAnchorIndex, setSearchAnchorIndex] = useState(-1); 
  const [searchDisplayRange, setSearchDisplayRange] = useState({ start: 0, end: 0 }); 
  const [isLoadingContext, setIsLoadingContext] = useState(false); 
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScrollingRef = useRef(false); 
  const MESSAGES_PER_PAGE = 15;

  // Mark messages as read when conversation is opened or changed
  useEffect(() => {
    if (conversation && userId) {
      markAsRead(conversation.userId, userId);
      
      if (onMarkAsRead) {
        onMarkAsRead(conversation.userId, userId);
      }
    }
  }, [conversation?.userId, userId, markAsRead, onMarkAsRead]);

  // Load conversation history 
  useEffect(() => {
    if (!conversation || !userId) {
      setHistory([]);
      return;
    }

    // Reset states when conversation changes
    setHistory([]);
    setHistoryPage(0);
    setHasMoreHistory(true);
    setShouldScrollToBottom(true);

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
  }, [conversation?.userId, userId, fetchChatHistory]);

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

  // Paginate messages - show only recent messages initially OR search range
  const displayedMessages = useMemo(() => {
    if (searchMode && searchDisplayRange.start >= 0 && searchDisplayRange.end >= 0) {
      return allMessages.slice(searchDisplayRange.start, searchDisplayRange.end + 1);
    } else {
      const messagesCount = allMessages.length;
      const startIndex = Math.max(0, messagesCount - MESSAGES_PER_PAGE * (historyPage + 1));
      return allMessages.slice(startIndex);
    }
  }, [allMessages, historyPage, MESSAGES_PER_PAGE, searchMode, searchDisplayRange]);

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

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Auto scroll khi có tin nhắn mới hoặc khi cần thiết
  useEffect(() => {
    if (searchMode) {
      setShouldScrollToBottom(false);
      return;
    }
    
    const currentMessageCount = displayedMessages.length;
    
    if (shouldScrollToBottom || (currentMessageCount > lastMessageCount && lastMessageCount > 0)) {
      setTimeout(() => scrollToBottom(lastMessageCount > 0), 100);
      setShouldScrollToBottom(false);
    }
    
    setLastMessageCount(currentMessageCount);
  }, [displayedMessages.length, shouldScrollToBottom, lastMessageCount, scrollToBottom, searchMode]);

  // Handle scroll - Load more messages khi scroll to top
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (searchMode) {
      if (scrollTop === 0 && searchDisplayRange.start > 0 && !isLoadingContext) {
        setIsLoadingContext(true);
        const currentStart = searchDisplayRange.start;
        const newStart = Math.max(0, currentStart - 5);
        setTimeout(() => {
          setSearchDisplayRange(prev => ({
            ...prev,
            start: newStart
          }));
          setIsLoadingContext(false);
        }, 300);
      } else if (scrollTop + clientHeight >= scrollHeight - 1 && searchDisplayRange.end < allMessages.length - 1 && !isLoadingContext) {
        setIsLoadingContext(true);
        const currentEnd = searchDisplayRange.end;
        const newEnd = Math.min(allMessages.length - 1, currentEnd + 5); 
        setTimeout(() => {
          setSearchDisplayRange(prev => ({
            ...prev,
            end: newEnd
          }));
          setIsLoadingContext(false);
        }, 300);
      }
    } else {
      if (scrollTop === 0 && !loadingMore && hasMoreHistory) {
        setLoadingMore(true);
        setTimeout(() => {
          setHistoryPage(prev => prev + 1);
          setLoadingMore(false);
        }, 500);
      }
    }
  }, [loadingMore, hasMoreHistory, searchMode, searchDisplayRange, allMessages.length, isLoadingContext]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Chỉ hỗ trợ file ảnh và video!');
      return;
    }

    // Kiểm tra kích thước file (50MB)
    const maxSize = 50 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert('File không được vượt quá 50MB!');
      return;
    }

    if (!conversation || !sendMessage) return;

    setIsUploading(true);

    try {
      const fileUrl = await uploadMedia(file);
      
      await sendMessage(conversation.userId, fileUrl);
      
      if (!searchMode) {
        setShouldScrollToBottom(true);
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Có lỗi xảy ra khi gửi file!');
    } finally {
      setIsUploading(false);
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [conversation, sendMessage, searchMode]);

  const handleSend = useCallback(() => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !conversation || !sendMessage) return;
    
    // Gửi tin nhắn text bình thường
    sendMessage(conversation.userId, trimmedInput);
    setInput('');
    
    if (!searchMode) {
      setShouldScrollToBottom(true);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [input, conversation, sendMessage, searchMode]);

  const handlePaperclipClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setHasSearched(false);
      setSearchMode(false);
      setSearchAnchorIndex(-1);
      setSearchDisplayRange({ start: 0, end: 0 });
      return;
    }

    const results: number[] = [];
    allMessages.forEach((message, index) => {
      if (message.message.toLowerCase().includes(query.toLowerCase())) {
        results.push(index);
      }
    });

    setHasSearched(true);
    setSearchResults(results);
    
    if (results.length > 0) {
      const lastResultIndex = results.length - 1;
      const searchResultMessageIndex = results[lastResultIndex];
      
      setCurrentSearchIndex(lastResultIndex);
      setSearchAnchorIndex(searchResultMessageIndex);
      setSearchMode(true);
      
      const contextSize = 8; 
      
      const startIndex = searchResultMessageIndex;
      const endIndex = Math.min(allMessages.length - 1, searchResultMessageIndex + contextSize - 1);
      
      setSearchDisplayRange({ start: startIndex, end: endIndex });
      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0;
        }
      }, 200); 
    } else {
      setCurrentSearchIndex(-1);
      setSearchMode(false);
      setSearchAnchorIndex(-1);
      setSearchDisplayRange({ start: 0, end: 0 });
    }
  }, [allMessages]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  const navigateSearchResults = useCallback((direction: 'up' | 'down') => {
    if (searchResults.length === 0 || isScrollingRef.current) return;

    let newIndex;
    if (direction === 'up') {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    } else {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    }

    setCurrentSearchIndex(newIndex);
    
    const newSearchResultMessageIndex = searchResults[newIndex];
    setSearchAnchorIndex(newSearchResultMessageIndex);
    
    const contextSize = 8;
    
    const startIndex = newSearchResultMessageIndex;
    const endIndex = Math.min(allMessages.length - 1, newSearchResultMessageIndex + contextSize - 1);
    
    setSearchDisplayRange({ start: startIndex, end: endIndex });
    
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0;
      }
    }, 100);
  }, [searchResults, currentSearchIndex, allMessages]);

  const handleSearchToggle = useCallback(() => {
    setShowSearchBar(!showSearchBar);
    if (!showSearchBar) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setHasSearched(false);
      setSearchMode(false);
      setSearchAnchorIndex(-1);
      setSearchDisplayRange({ start: 0, end: 0 });
      
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [showSearchBar, scrollToBottom]);

  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setShowSearchBar(false);
    setHasSearched(false);
    setSearchMode(false);
    setSearchAnchorIndex(-1);
    setSearchDisplayRange({ start: 0, end: 0 });
  }, [conversation?.userId]);

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
                <span className="capitalize">{getRoleInVietnamese(conversation.role)}</span>
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
          <button 
            onClick={handleSearchToggle}
            className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${showSearchBar ? 'bg-blue-50 text-blue-600' : ''}`}
            title="Tìm kiếm"
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Thông tin">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tin nhắn... (nhấn Enter để tìm)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Search Button */}
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              disabled={!searchQuery.trim()}
            >
              Tìm
            </button>
            
            {/* Search Results Info & Navigation */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="whitespace-nowrap">
                  {currentSearchIndex + 1}/{searchResults.length}
                </span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => navigateSearchResults('up')}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Kết quả trước"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSearchResults('down')}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Kết quả sau"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Close Search */}
            <button
              type="button"
              onClick={handleSearchToggle}
              className="p-1 hover:bg-gray-200 rounded"
              title="Đóng tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
          
          {hasSearched && searchQuery && searchResults.length === 0 && (
            <div className="text-sm text-gray-500 mt-2">
              Không tìm thấy tin nhắn nào chứa "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
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
            {/* Loading indicator when loading more old messages in search mode */}
            {searchMode && isLoadingContext && (
              <div className="flex justify-center py-2">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs">Đang tải thêm...</span>
                </div>
              </div>
            )}

            {/* Loading more context indicator for search mode */}
            {searchMode && searchDisplayRange.start > 0 && !isLoadingContext && (
              <div className="flex justify-center py-2">
                <button
                  onClick={() => {
                    const currentStart = searchDisplayRange.start;
                    const newStart = Math.max(0, currentStart - 10);
                    setSearchDisplayRange(prev => ({ ...prev, start: newStart }));
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Tải thêm tin nhắn cũ hơn...
                </button>
              </div>
            )}

            {loadingMore && !searchMode && (
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
                  {group.messages.map((message, messageIndexInGroup) => {
                    let actualMessageIndex = 0;
                    
                    if (searchMode) {
                      actualMessageIndex = allMessages.findIndex(m => 
                        m.timestamp === message.timestamp && 
                        m.message === message.message &&
                        m.senderId === message.senderId
                      );
                    } else {
                      for (let i = 0; i < groupIndex; i++) {
                        actualMessageIndex += groupedMessages[i].messages.length;
                      }
                      actualMessageIndex += messageIndexInGroup;
                    }

                    const isCurrentSearchResult = searchMode && actualMessageIndex === searchAnchorIndex;
                    
                    return (
                      <MessageItem
                        key={`${groupIndex}-${messageIndexInGroup}`}
                        message={message}
                        isMine={message.senderId === userId}
                        conversationUser={conversation}
                        messageIndex={actualMessageIndex}
                        searchQuery={hasSearched && isCurrentSearchResult ? searchQuery : ''}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {searchMode && searchDisplayRange.end < allMessages.length - 1 && (
              <div className="flex justify-center py-2">
                <button
                  onClick={() => {
                    const currentEnd = searchDisplayRange.end;
                    const newEnd = Math.min(allMessages.length - 1, currentEnd + 10);
                    setSearchDisplayRange(prev => ({ ...prev, end: newEnd }));
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Tải thêm tin nhắn mới hơn...
                </button>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          multiple={false}
          title ="Chọn file ảnh/video"
        />

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePaperclipClick}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Chọn file ảnh/video"
          >
            <Paperclip className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isUploading}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={(!input.trim()) || isUploading}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              input.trim() && !isUploading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Đang tải file lên...</span>
          </div>
        )}
      </div>
    </div>
  );
};