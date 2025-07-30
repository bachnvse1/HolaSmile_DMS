import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';
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
  roleFilter: 'all';
}

const ITEMS_PER_PAGE = 20;

export const usePatientConversations = () => {
  const { userId } = useAuth();
  const { messages: realtimeMessages, fetchChatHistory } = useChatHub();
  
  // 🔥 Use useUnreadMessages hook instead of managing unread counts manually
  const { 
    getUnreadCount, 
    getTotalUnreadCount, 
    markConversationAsRead,
    refreshUnreadCounts 
  } = useUnreadMessages(userId);
  
  const [users, setUsers] = useState<ConversationUser[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Map<string, ChatMessage[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasLoadedInitialConversations, setHasLoadedInitialConversations] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({
    searchTerm: '',
    roleFilter: 'all'
  });

  // 🔥 Refresh unread counts when userId changes (F5, login, etc.)
  useEffect(() => {
    if (userId) {
      refreshUnreadCounts();
    }
  }, [userId, refreshUnreadCounts]);

  // Load data from sessionStorage when userId changes
  useEffect(() => {
    if (!userId) return;
    
    setHasLoadedInitialConversations(false);
    
    try {
      const saved = sessionStorage.getItem(`patientConversationHistory_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversationHistory(new Map(Object.entries(parsed)));
      } else {
        setConversationHistory(new Map());
      }
    } catch (error) {
      console.error('Error restoring patient conversation history:', error);
      setConversationHistory(new Map());
    }
  }, [userId]);

  // Clear sessionStorage data when userId changes
  useEffect(() => {
    if (!userId) return;
    
    const currentStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('patientConversationHistory_') || 
      key.startsWith('patientUnreadCounts_') ||
      key.startsWith('processedPatientMessages_')
    );
    
    currentStorageKeys.forEach(key => {
      if (!key.endsWith(`_${userId}`)) {
        sessionStorage.removeItem(key);
      }
    });
  }, [userId]);

  // Load users - FILTER RA PATIENTS
  useEffect(() => {
    const loadUsers = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await axiosInstance.get('/user/allUsersChat', {
          withCredentials: true
        });
        console.log('Patient conversations response:', response.data);
        
        if (Array.isArray(response.data)) {
          // API returns array directly - FILTER CHỈ LẤY PATIENTS
          const patientUsers = response.data.filter((user: ConversationUser) => 
            user.role === 'Patient' && 
            user.userId !== userId
          );
          console.log('Filtered patient users:', patientUsers);
          setUsers(patientUsers);
        } else if (response.data?.success && Array.isArray(response.data.data)) {
          // API returns object with success and data - FILTER CHỈ LẤY PATIENTS
          const patientUsers = response.data.data.filter((user: ConversationUser) => 
            user.role === 'Patient' && 
            user.userId !== userId
          );
          console.log('Filtered patient users:', patientUsers);
          setUsers(patientUsers);
        } else {
          console.error('Invalid response format:', response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userId]);

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

  // Auto-load conversation history for ALL patients to detect existing conversations
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
            console.debug(`No conversation history for patient ${user.userId}`);
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

  // 🔥 Refresh unread counts when new realtime messages arrive
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;
    
    const lastMessage = realtimeMessages[realtimeMessages.length - 1];
    
    // If message is TO current user (not FROM current user), refresh unread counts
    if (lastMessage.receiverId === userId && lastMessage.senderId !== userId) {
      // Small delay to ensure backend has processed the message
      setTimeout(() => {
        refreshUnreadCounts();
      }, 500);
    }
  }, [realtimeMessages, userId, refreshUnreadCounts]);

  // Build conversations list
  const conversations = useMemo(() => {
    if (!userId) return [];
    
    const conversations: ConversationUser[] = [];
    
    for (const user of users) {
      const userHistory = conversationHistory.get(user.userId) || [];
      
      const realtimeForUser = realtimeMessages.filter(msg => 
        (msg.senderId === userId && msg.receiverId === user.userId) ||
        (msg.senderId === user.userId && msg.receiverId === userId)
      );
      
      const allMessages = [...userHistory, ...realtimeForUser]
        .sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());
      
      const uniqueMessages = allMessages.filter((msg, index, arr) => 
        arr.findIndex(m => 
          m.senderId === msg.senderId && 
          m.receiverId === msg.receiverId && 
          m.message === msg.message &&
          Math.abs(new Date(m.timestamp || '').getTime() - new Date(msg.timestamp || '').getTime()) < 1000
        ) === index
      );
      
      const lastMessage = uniqueMessages[uniqueMessages.length - 1];
      
      // 🔥 Get unread count from useUnreadMessages hook
      const unreadCount = getUnreadCount(user.userId);
      
      // Include all patients - HIỂN THỊ TẤT CẢ PATIENTS
      conversations.push({
        ...user,
        lastMessage,
        lastMessageTime: lastMessage?.timestamp,
        unreadCount,
        hasUnreadMessages: unreadCount > 0
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
  }, [users, userId, conversationHistory, realtimeMessages, getUnreadCount]);

  // Apply filters
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv: ConversationUser) => {
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = conv.fullName.toLowerCase().includes(searchLower);
        const matchesPhone = conv.phone?.toLowerCase().includes(searchLower);
        const matchesMessage = conv.lastMessage?.message.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesPhone && !matchesMessage) {
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
    setCurrentPage(0);
  }, []);

  // Load more conversations
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage((prev: number) => prev + 1);
    }
  }, [hasMore, loading]);

  // 🔥 Mark conversation as read - use useUnreadMessages hook
  const markAsRead = useCallback(async (otherUserId: string) => {
    if (!userId) return;
    
    // Use the markConversationAsRead from useUnreadMessages hook
    await markConversationAsRead(otherUserId, userId);
    
    // Also mark all messages from this user as read in local history
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
  }, [userId, markConversationAsRead]);

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

  // Save to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const historyObj = Object.fromEntries(conversationHistory);
      sessionStorage.setItem(`patientConversationHistory_${userId}`, JSON.stringify(historyObj));
    } catch (error) {
      console.error('Error saving patient conversation history:', error);
    }
  }, [conversationHistory, userId]);

  // 🔥 Count total unread messages using useUnreadMessages hook
  const totalUnreadCount = useMemo(() => {
    return getTotalUnreadCount();
  }, [getTotalUnreadCount]);

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