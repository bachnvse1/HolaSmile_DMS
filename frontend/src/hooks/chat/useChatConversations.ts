import { useState, useEffect, useMemo, useCallback } from 'react';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  messageId?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
  isRead?: boolean;
  isDelivered?: boolean;
}

export interface ConversationUser {
  userId: string;
  fullName: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  lastMessage?: ChatMessage;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  hasUnreadMessages?: boolean;
}

export interface ConversationFilters {
  searchTerm: string;
  roleFilter: 'all' | 'Patient' | 'Dentist' | 'staff';
}

export const useChatConversations = () => {
  const { userId } = useAuth();
  const { 
    messages: realtimeMessages, 
    fetchChatHistory,
    users,
    fetchUsers
  } = useChatHub();

  const [filters, setFilters] = useState<ConversationFilters>({
    searchTerm: '',
    roleFilter: 'all'
  });
  
  const [conversationHistory, setConversationHistory] = useState<Map<string, ChatMessage[]>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  // Load data from sessionStorage when userId changes
  useEffect(() => {
    if (!userId) return;
    
    // Reset loading flag for new user
    setHasLoadedInitialConversations(false);
    
    // Load conversation history
    try {
      const saved = sessionStorage.getItem(`chatConversationHistory_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversationHistory(new Map(Object.entries(parsed)));
      } else {
        setConversationHistory(new Map());
      }
    } catch (error) {
      console.error('Error restoring conversation history:', error);
      setConversationHistory(new Map());
    }
    
    // Load unread counts
    try {
      const saved = sessionStorage.getItem(`chatUnreadCounts_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUnreadCounts(new Map(Object.entries(parsed).map(([k, v]) => [k, Number(v)])));
      } else {
        setUnreadCounts(new Map());
      }
    } catch (error) {
      console.error('Error restoring unread counts:', error);
      setUnreadCounts(new Map());
    }
  }, [userId]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasLoadedInitialConversations, setHasLoadedInitialConversations] = useState(false);
  
  const ITEMS_PER_PAGE = 20;

  // Clear sessionStorage data when userId changes
  useEffect(() => {
    if (!userId) return;
    
    // Clear old data for different user
    const currentStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('chatConversationHistory_') || 
      key.startsWith('chatUnreadCounts_') ||
      key.startsWith('processedMessages_')
    );
    
    currentStorageKeys.forEach(key => {
      if (!key.endsWith(`_${userId}`)) {
        sessionStorage.removeItem(key);
      }
    });
  }, [userId]);

  // Fetch users initially and load recent conversations
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load conversation history for users with messages
  const loadConversationHistory = useCallback(async (targetUserId: string) => {
    if (!userId || conversationHistory.has(targetUserId)) return;
    
    try {
      const history = await fetchChatHistory(userId, targetUserId);
      if (history.length > 0) {
        // Set proper message status for existing messages
        const messagesWithStatus = history.map((msg: ChatMessage) => ({
          ...msg,
          isDelivered: true, // Assume all historical messages are delivered
          isRead: msg.senderId !== userId ? false : true // Only mark own messages as read
        }));
        
        setConversationHistory(prev => new Map(prev.set(targetUserId, messagesWithStatus)));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }, [userId, fetchChatHistory, conversationHistory]);

  // Auto-load conversation history for users with existing messages
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;
    
    const usersWithMessages = new Set<string>();
    realtimeMessages.forEach(msg => {
      if (msg.senderId === userId) {
        usersWithMessages.add(msg.receiverId);
      } else if (msg.receiverId === userId) {
        usersWithMessages.add(msg.senderId);
      }
    });
    
    usersWithMessages.forEach(targetUserId => {
      loadConversationHistory(targetUserId);
    });
  }, [userId, realtimeMessages, loadConversationHistory]);

  // Load conversation history for users with previous conversations on mount
  useEffect(() => {
    if (!users || !userId) return;
    
    // Check for users that have unread counts (indicating previous conversations)
    unreadCounts.forEach((count, targetUserId) => {
      if (count > 0 && users.find(u => u.userId === targetUserId)) {
        loadConversationHistory(targetUserId);
      }
    });
  }, [users, userId, unreadCounts, loadConversationHistory]);

  // Auto-load conversation history for ALL users to detect existing conversations
  useEffect(() => {
    if (!users || !userId || users.length === 0 || hasLoadedInitialConversations) return;
    
    const loadAllConversations = async () => {
      let hasUpdated = false;
      for (const user of users) {
        if (user.userId !== userId && !conversationHistory.has(user.userId)) {
          try {
            const history = await fetchChatHistory(userId, user.userId);
            if (history && history.length > 0) {
              // Set proper message status for existing messages
              const messagesWithStatus = history.map((msg: ChatMessage) => ({
                ...msg,
                isDelivered: true, // Assume all historical messages are delivered
                isRead: msg.senderId !== userId ? false : true // Mark own messages as read, others as unread
              }));
              
              setConversationHistory(prev => new Map(prev.set(user.userId, messagesWithStatus)));
              
              // Don't set unread counts here - let the sync effect handle it
              // This prevents duplicate counting on reload
              hasUpdated = true;
            }
          } catch {
            // Ignore errors for individual users - they might not have conversation history
            console.debug(`No conversation history for user ${user.userId}`);
          }
        }
      }
      if (hasUpdated) {
        setHasLoadedInitialConversations(true);
      }
    };

    // Add a small delay to avoid overwhelming the API
    const timer = setTimeout(loadAllConversations, 1000);
    return () => clearTimeout(timer);
  }, [users, userId, fetchChatHistory, hasLoadedInitialConversations, conversationHistory]);

  // Sync unread counts with actual conversation history when data is loaded
  useEffect(() => {
    if (!userId || conversationHistory.size === 0) return;
    
    // Create a debounced update to avoid too frequent updates
    const timeoutId = setTimeout(() => {
      // Recalculate unread counts based on actual message status in history
      const updatedUnreadCounts = new Map<string, number>();
      
      conversationHistory.forEach((messages, targetUserId) => {
        const unreadCount = messages.filter(msg => 
          msg.senderId === targetUserId && !msg.isRead
        ).length;
        
        updatedUnreadCounts.set(targetUserId, unreadCount);
      });
      
      // Only update if there are actual differences to avoid unnecessary re-renders
      setUnreadCounts(prev => {
        let hasChanges = false;
        
        // Check for differences
        updatedUnreadCounts.forEach((count, userId) => {
          if (prev.get(userId) !== count) {
            hasChanges = true;
          }
        });
        
        // Also check if any users were removed
        prev.forEach((_, userId) => {
          if (!updatedUnreadCounts.has(userId)) {
            hasChanges = true;
          }
        });
        
        return hasChanges ? updatedUnreadCounts : prev;
      });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [conversationHistory, userId]);
  const processedConversations = useMemo(() => {
    if (!users || !userId) return [];

    const conversations: ConversationUser[] = [];
    
    for (const user of users) {
      if (user.userId === userId) continue; // Skip self
      
      // Get conversation history for this user
      const userHistory = conversationHistory.get(user.userId) || [];
      
      // Get realtime messages for this conversation
      const realtimeForUser = realtimeMessages.filter(msg => 
        (msg.senderId === userId && msg.receiverId === user.userId) ||
        (msg.senderId === user.userId && msg.receiverId === userId)
      );
      
      // Combine and sort all messages
      const allMessages = [...userHistory, ...realtimeForUser]
        .sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());
      
      // Remove duplicates and ensure proper status
      const uniqueMessages = allMessages.filter((msg, index, arr) => 
        arr.findIndex(m => 
          m.senderId === msg.senderId && 
          m.receiverId === msg.receiverId && 
          m.message === msg.message &&
          Math.abs(new Date(m.timestamp || '').getTime() - new Date(msg.timestamp || '').getTime()) < 1000
        ) === index
      ).map(msg => {
        const msgWithStatus = msg as ChatMessage & { isDelivered?: boolean; isRead?: boolean };
        return {
          ...msg,
          // Ensure all messages have proper delivery/read status
          isDelivered: msgWithStatus.isDelivered !== undefined ? msgWithStatus.isDelivered : true,
          isRead: msgWithStatus.isRead !== undefined ? msgWithStatus.isRead : (msg.senderId === userId)
        };
      });
      
      const lastMessage = uniqueMessages[uniqueMessages.length - 1];
      
      // Calculate unread count directly from messages instead of relying on stored count
      const actualUnreadCount = uniqueMessages.filter(msg => 
        msg.senderId === user.userId && !msg.isRead
      ).length;
      
      // Include user if:
      // 1. Has messages OR
      // 2. Currently searching (to allow starting new conversations)
      if (lastMessage || filters.searchTerm.trim()) {
        conversations.push({
          ...user,
          lastMessage,
          lastMessageTime: lastMessage?.timestamp,
          unreadCount: actualUnreadCount, // Use calculated count instead of stored count
          hasUnreadMessages: actualUnreadCount > 0
        });
      }
    }
    
    return conversations;
  }, [users, userId, conversationHistory, realtimeMessages, filters.searchTerm]);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = processedConversations;
    
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.fullName.toLowerCase().includes(searchLower) ||
        conv.phone.includes(filters.searchTerm) ||
        conv.lastMessage?.message.toLowerCase().includes(searchLower)
      );
    }
    
    // Role filter
    if (filters.roleFilter !== 'all') {
      if (filters.roleFilter === 'staff') {
        filtered = filtered.filter(conv => 
          ['Administrator', 'Owner', 'Receptionist', 'Assistant'].includes(conv.role)
        );
      } else {
        filtered = filtered.filter(conv => conv.role === filters.roleFilter);
      }
    }
    
    // Sort by last message time (newest first), then unread count
    filtered.sort((a, b) => {
      // Prioritize unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      
      // Then sort by last message time
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA;
    });
    
    return filtered;
  }, [processedConversations, filters]);

  // Pagination
  const paginatedConversations = useMemo(() => {
    const endIndex = page * ITEMS_PER_PAGE;
    setHasMore(endIndex < filteredConversations.length);
    return filteredConversations.slice(0, endIndex);
  }, [filteredConversations, page]);

  // Handle new messages for unread count
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;
    
    const lastMessage = realtimeMessages[realtimeMessages.length - 1];
    
    // Only process if this is a truly new message (not from reload)
    const messageKey = `${lastMessage.senderId}-${lastMessage.receiverId}-${lastMessage.timestamp}`;
    const processedMessages = JSON.parse(sessionStorage.getItem(`processedMessages_${userId}`) || '[]');
    
    if (processedMessages.includes(messageKey)) {
      return; // Already processed this message
    }
    
    // Mark message as processed
    processedMessages.push(messageKey);
    // Keep only last 100 processed messages to avoid memory issues
    if (processedMessages.length > 100) {
      processedMessages.splice(0, processedMessages.length - 100);
    }
    sessionStorage.setItem(`processedMessages_${userId}`, JSON.stringify(processedMessages));
    
    // Simulate message delivery and read status
    if (lastMessage.senderId === userId) {
      // Own message - mark as delivered immediately
      const msgWithStatus = lastMessage as ChatMessage & { isDelivered: boolean; isRead: boolean };
      msgWithStatus.isDelivered = true;
      msgWithStatus.isRead = false;
      
      // Simulate read status after 2 seconds
      setTimeout(() => {
        msgWithStatus.isRead = true;
        // Update the message in conversation history
        setConversationHistory(prev => {
          const newHistory = new Map(prev);
          const userHistory = newHistory.get(lastMessage.receiverId) || [];
          const updatedHistory = userHistory.map(msg => 
            msg.senderId === lastMessage.senderId && 
            msg.timestamp === lastMessage.timestamp && 
            msg.message === lastMessage.message
              ? { ...msg, isRead: true, isDelivered: true }
              : msg
          );
          newHistory.set(lastMessage.receiverId, updatedHistory);
          return newHistory;
        });
      }, 2000);
    } else if (lastMessage.receiverId === userId) {
      // Incoming message - don't increment unread count here
      // Let the sync effect handle unread counting based on actual message status
      // This prevents duplicate counting
    }
  }, [realtimeMessages, userId]);

  // Load more conversations
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setLoading(true);
      setTimeout(() => {
        setPage(prev => prev + 1);
        setLoading(false);
      }, 500); // Simulate loading delay
    }
  }, [hasMore, loading]);

  // Mark conversation as read
  const markAsRead = useCallback((targetUserId: string) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.set(targetUserId, 0);
      return newCounts;
    });
    
    // Also mark all messages from this user as read
    setConversationHistory(prev => {
      const newHistory = new Map(prev);
      const userHistory = newHistory.get(targetUserId) || [];
      const updatedHistory = userHistory.map(msg => 
        msg.senderId === targetUserId
          ? { ...msg, isRead: true, isDelivered: true }
          : msg
      );
      newHistory.set(targetUserId, updatedHistory);
      return newHistory;
    });
  }, []);

  // Load conversation data when needed
  const loadConversationData = useCallback(async (targetUserId: string) => {
    await loadConversationHistory(targetUserId);
  }, [loadConversationHistory]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ConversationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset pagination
  }, []);

  // Save conversation history to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const historyObj = Object.fromEntries(conversationHistory);
      sessionStorage.setItem(`chatConversationHistory_${userId}`, JSON.stringify(historyObj));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }, [conversationHistory, userId]);

  // Save unread counts to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const countsObj = Object.fromEntries(unreadCounts);
      sessionStorage.setItem(`chatUnreadCounts_${userId}`, JSON.stringify(countsObj));
    } catch (error) {
      console.error('Error saving unread counts:', error);
    }
  }, [unreadCounts, userId]);

  // Count total unread messages across all conversations
  const totalUnreadCount = useMemo(() => {
    return filteredConversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }, [filteredConversations]);

  return {
    conversations: paginatedConversations,
    filters,
    updateFilters,
    loadMore,
    hasMore,
    loading,
    markAsRead,
    loadConversationData,
    totalCount: filteredConversations.length,
    totalUnreadCount
  };
};