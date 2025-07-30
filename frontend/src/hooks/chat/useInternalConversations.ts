import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import axiosInstance from '@/lib/axios';

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
  roleFilter: 'all' | 'Dentist' | 'Owner' | 'Administrator' | 'Receptionist' | 'Assistant';
}

const ITEMS_PER_PAGE = 20;

export const useInternalConversations = () => {
  const { userId } = useAuth();
  const { messages: realtimeMessages, fetchChatHistory } = useChatHub();
  const [users, setUsers] = useState<ConversationUser[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Map<string, ChatMessage[]>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasLoadedInitialConversations, setHasLoadedInitialConversations] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({
    searchTerm: '',
    roleFilter: 'all'
  });

  // Define staff roles
  const STAFF_ROLES = useMemo(() => ["Administrator", "Owner", "Receptionist", "Assistant", "Dentist"], []);

  // Load data from sessionStorage when userId changes
  useEffect(() => {
    if (!userId) return;
    
    // Reset loading flag for new user
    setHasLoadedInitialConversations(false);
    
    // Load conversation history
    try {
      const saved = sessionStorage.getItem(`internalConversationHistory_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversationHistory(new Map(Object.entries(parsed)));
      } else {
        setConversationHistory(new Map());
      }
    } catch (error) {
      console.error('Error restoring internal conversation history:', error);
      setConversationHistory(new Map());
    }
    
    // Load unread counts
    try {
      const saved = sessionStorage.getItem(`internalUnreadCounts_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUnreadCounts(new Map(Object.entries(parsed).map(([k, v]) => [k, Number(v)])));
      } else {
        setUnreadCounts(new Map());
      }
    } catch (error) {
      console.error('Error restoring internal unread counts:', error);
      setUnreadCounts(new Map());
    }
  }, [userId]);

  // Clear sessionStorage data when userId changes
  useEffect(() => {
    if (!userId) return;
    
    // Clear old data for different user
    const currentStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('internalConversationHistory_') || 
      key.startsWith('internalUnreadCounts_') ||
      key.startsWith('processedInternalMessages_')
    );
    
    currentStorageKeys.forEach(key => {
      if (!key.endsWith(`_${userId}`)) {
        sessionStorage.removeItem(key);
      }
    });
  }, [userId]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await axiosInstance.get('/user/allUsersChat', {
          withCredentials: true
        });
        console.log('Internal conversations response:', response.data);
        if (Array.isArray(response.data)) {
          const staffUsers = response.data.filter((user: ConversationUser) => 
            STAFF_ROLES.includes(user.role) && 
            user.role !== 'Patient' && 
            user.userId !== userId
          );
          console.log('Filtered staff users:', staffUsers);
          setUsers(staffUsers);
        } else if (response.data?.success && Array.isArray(response.data.data)) {
          const staffUsers = response.data.data.filter((user: ConversationUser) => 
            STAFF_ROLES.includes(user.role) && 
            user.role !== 'Patient' && 
            user.userId !== userId
          );
          console.log('Filtered staff users:', staffUsers);
          setUsers(staffUsers);
        } else {
          console.error('Invalid response format:', response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading internal users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userId, STAFF_ROLES]);

  // Load conversation history for users with messages
  const loadConversationHistory = useCallback(async (targetUserId: string) => {
    if (!userId || conversationHistory.has(targetUserId)) return;
    
    try {
      const history = await fetchChatHistory(userId, targetUserId);
      if (history && history.length > 0) {
        setConversationHistory(prev => new Map(prev.set(targetUserId, history)));
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

  // Auto-load conversation history for ALL staff users to detect existing conversations
  useEffect(() => {
    if (!users || !userId || users.length === 0 || hasLoadedInitialConversations) return;
    
    const loadAllConversations = async () => {
      let hasUpdated = false;
      for (const user of users) {
        if (user.userId !== userId && !conversationHistory.has(user.userId)) {
          try {
            const history = await fetchChatHistory(userId, user.userId);
            if (history && history.length > 0) {
              setConversationHistory((prev: Map<string, ChatMessage[]>) => {
                const newHistory = new Map(prev);
                newHistory.set(user.userId, history);
                return newHistory;
              });
              hasUpdated = true;
            }
          } catch {
            console.debug(`No conversation history for user ${user.userId}`);
          }
        }
      }
      if (hasUpdated) {
        setHasLoadedInitialConversations(true);
      }
    };

    const timer = setTimeout(loadAllConversations, 1500);
    return () => clearTimeout(timer);
  }, [users, userId, fetchChatHistory, hasLoadedInitialConversations, conversationHistory]);

  // Handle new messages for unread count
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;
    
    const lastMessage = realtimeMessages[realtimeMessages.length - 1];
    
    // Only count unread if message is TO current user (not FROM current user)
    if (lastMessage.receiverId === userId && lastMessage.senderId !== userId) {
      // Only process if this is a truly new message (not from reload)
      const messageKey = `${lastMessage.senderId}-${lastMessage.receiverId}-${lastMessage.timestamp}`;
      const processedMessages = JSON.parse(sessionStorage.getItem(`processedInternalMessages_${userId}`) || '[]');
      
      if (!processedMessages.includes(messageKey)) {
        // Mark message as processed
        processedMessages.push(messageKey);
        if (processedMessages.length > 100) {
          processedMessages.splice(0, processedMessages.length - 100);
        }
        sessionStorage.setItem(`processedInternalMessages_${userId}`, JSON.stringify(processedMessages));
        
        // Increment unread count for sender
        setUnreadCounts(prev => {
          const newCounts = new Map(prev);
          const currentCount = newCounts.get(lastMessage.senderId) || 0;
          newCounts.set(lastMessage.senderId, currentCount + 1);
          return newCounts;
        });
      }
    }
  }, [realtimeMessages, userId]);

  // Build conversations list with accurate unread counts
  const conversations = useMemo(() => {
    if (!userId) return [];
    
    const conversations: ConversationUser[] = [];
    
    for (const user of users) {
      const userHistory = conversationHistory.get(user.userId) || [];
      
      // Get realtime messages for this user
      const realtimeForUser = realtimeMessages.filter(msg => 
        (msg.senderId === userId && msg.receiverId === user.userId) ||
        (msg.senderId === user.userId && msg.receiverId === userId)
      );
      
      // Combine and sort all messages
      const allMessages = [...userHistory, ...realtimeForUser]
        .sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());
      
      // Remove duplicates
      const uniqueMessages = allMessages.filter((msg, index, arr) => 
        arr.findIndex(m => 
          m.senderId === msg.senderId && 
          m.receiverId === msg.receiverId && 
          m.message === msg.message &&
          Math.abs(new Date(m.timestamp || '').getTime() - new Date(msg.timestamp || '').getTime()) < 1000
        ) === index
      );
      
      const lastMessage = uniqueMessages[uniqueMessages.length - 1];
      
      // Get stored unread count (this includes real-time updates)
      const storedUnreadCount = unreadCounts.get(user.userId) || 0;
      
      // Always include all staff members
      conversations.push({
        ...user,
        lastMessage,
        lastMessageTime: lastMessage?.timestamp,
        unreadCount: storedUnreadCount,
        hasUnreadMessages: storedUnreadCount > 0
      });
    }
    
    // Sort conversations by priority
    return conversations.sort((a, b) => {
      // First: Conversations with unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Second: Conversations with recent messages
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      
      // Third: Alphabetical by name
      return a.fullName.localeCompare(b.fullName);
    });
  }, [users, userId, conversationHistory, realtimeMessages, unreadCounts]);

  // Apply filters
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv: ConversationUser) => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = conv.fullName.toLowerCase().includes(searchLower);
        const matchesPhone = conv.phone?.toLowerCase().includes(searchLower);
        const matchesMessage = conv.lastMessage?.message.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesPhone && !matchesMessage) {
          return false;
        }
      }
      
      // Role filter
      if (filters.roleFilter !== 'all') {
        if (conv.role !== filters.roleFilter) {
          return false;
        }
      }
      
      return true;
    });
  }, [conversations, filters]);

  // Paginate conversations
  const paginatedConversations = useMemo(() => {
    const startIndex = 0;
    const endIndex = (currentPage + 1) * ITEMS_PER_PAGE;
    return filteredConversations.slice(startIndex, endIndex);
  }, [filteredConversations, currentPage]);

  const hasMore = paginatedConversations.length < filteredConversations.length;

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ConversationFilters>) => {
    setFilters((prev: ConversationFilters) => ({ ...prev, ...newFilters }));
    setCurrentPage(0); // Reset pagination when filters change
  }, []);

  // Load more conversations
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage((prev: number) => prev + 1);
    }
  }, [hasMore, loading]);

  // Mark conversation as read - clear unread count
  const markAsRead = useCallback((otherUserId: string) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.set(otherUserId, 0);
      return newCounts;
    });
    
    // Also mark all messages from this user as read
    setConversationHistory(prev => {
      const newHistory = new Map(prev);
      const userHistory = newHistory.get(otherUserId) || [];
      const updatedHistory = userHistory.map(msg => 
        msg.senderId === otherUserId
          ? { ...msg, isRead: true, isDelivered: true }
          : msg
      );
      newHistory.set(otherUserId, updatedHistory);
      return newHistory;
    });
  }, []);

  // Load conversation data
  const loadConversationData = useCallback(async (otherUserId: string) => {
    if (!userId || !fetchChatHistory) return;
    
    try {
      const history = await fetchChatHistory(userId, otherUserId);
      setConversationHistory((prev: Map<string, ChatMessage[]>) => {
        const newHistory = new Map(prev);
        newHistory.set(otherUserId, Array.isArray(history) ? history : []);
        return newHistory;
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [userId, fetchChatHistory]);

  // Save conversation history to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const historyObj = Object.fromEntries(conversationHistory);
      sessionStorage.setItem(`internalConversationHistory_${userId}`, JSON.stringify(historyObj));
    } catch (error) {
      console.error('Error saving internal conversation history:', error);
    }
  }, [conversationHistory, userId]);

  // Save unread counts to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const countsObj = Object.fromEntries(unreadCounts);
      sessionStorage.setItem(`internalUnreadCounts_${userId}`, JSON.stringify(countsObj));
    } catch (error) {
      console.error('Error saving internal unread counts:', error);
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