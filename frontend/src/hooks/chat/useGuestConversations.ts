import { useState, useEffect, useMemo, useCallback } from 'react';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';

export interface GuestInfo {
  guestId: string;
  name?: string;
  lastMessageAt?: string;
}

export interface GuestConversation {
  guestId: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  lastMessageAt?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatMessage {
  messageId?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
  isRead?: boolean;
  isDelivered?: boolean;
}

export const useGuestConversations = () => {
  const { userId } = useAuth();
  const { 
    messages: realtimeMessages, 
    fetchChatHistory,
    guests,
    fetchGuests
  } = useChatHub();

  // Use useUnreadMessages hook instead of managing unread counts manually
  const { 
    getUnreadCount, 
    markConversationAsRead,
    refreshUnreadCounts 
  } = useUnreadMessages(userId);

  const [conversationHistory, setConversationHistory] = useState<Map<string, ChatMessage[]>>(new Map());
  const [loading, setLoading] = useState(false);

  // Refresh unread counts when userId changes (F5, login, etc.)
  useEffect(() => {
    if (userId) {
      refreshUnreadCounts();
    }
  }, [userId, refreshUnreadCounts]);

  // Load data from sessionStorage when userId changes
  useEffect(() => {
    if (!userId) return;
    
    // Load conversation history
    try {
      const saved = sessionStorage.getItem(`guestConversationHistory_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversationHistory(new Map(Object.entries(parsed)));
      } else {
        setConversationHistory(new Map());
      }
    } catch (error) {
      console.error('Error restoring guest conversation history:', error);
      setConversationHistory(new Map());
    }
  }, [userId]);

  // Clear old sessionStorage data when userId changes
  useEffect(() => {
    if (!userId) return;
    
    // Clear old data for different user
    const currentStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('guestConversationHistory_') || 
      key.startsWith('guestUnreadCounts_') ||
      key.startsWith('processedGuestMessages_')
    );
    
    currentStorageKeys.forEach(key => {
      if (!key.endsWith(`_${userId}`)) {
        sessionStorage.removeItem(key);
      }
    });
  }, [userId]);

  // Fetch guests initially
  useEffect(() => {
    if (fetchGuests) {
      setLoading(true);
      fetchGuests()
        .catch(error => console.error('Error fetching guests:', error))
        .finally(() => setLoading(false));
    }
  }, [fetchGuests]);

  // Load conversation history for a guest
  const loadGuestHistory = useCallback(async (guestId: string) => {
    if (!userId || conversationHistory.has(guestId)) return;
    
    try {
      const history = await fetchChatHistory(userId, guestId);
      if (history && history.length > 0) {
        setConversationHistory(prev => new Map(prev.set(guestId, history)));
      }
    } catch (error) {
      console.error('Error loading guest history:', error);
    }
  }, [userId, fetchChatHistory, conversationHistory]);

  // Refresh unread counts when new realtime messages arrive
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

  // Process guest conversations
  const guestConversations = useMemo(() => {
    if (!guests || !userId) return [];

    const conversations: GuestConversation[] = [];
    
    for (const guest of guests) {
      const guestHistory = conversationHistory.get(guest.guestId) || [];
      
      // Get realtime messages for this guest
      const realtimeForGuest = realtimeMessages.filter(msg => 
        (msg.senderId === userId && msg.receiverId === guest.guestId) ||
        (msg.senderId === guest.guestId && msg.receiverId === userId)
      );
      
      // Combine and sort all messages
      const allMessages = [...guestHistory, ...realtimeForGuest]
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
      
      // Get unread count from useUnreadMessages hook
      const unreadCount = getUnreadCount(guest.guestId);
      
      // Always add guest to conversation list
      conversations.push({
        guestId: guest.guestId,
        name: guest.name || `Khách ${guest.guestId.slice(0, 8)}`,
        phoneNumber: undefined,
        email: undefined,
        lastMessageAt: lastMessage?.timestamp || undefined,
        lastMessage: lastMessage || undefined,
        unreadCount
      });
    }
    
    // Sort by priority
    conversations.sort((a, b) => {
      // First: Conversations with unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Second: Conversations with recent messages
      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      }
      if (a.lastMessageAt && !b.lastMessageAt) return -1;
      if (!a.lastMessageAt && b.lastMessageAt) return 1;
      
      // Third: By guest ID (most recent guests first)
      return b.guestId.localeCompare(a.guestId);
    });
    
    return conversations;
  }, [guests, userId, conversationHistory, realtimeMessages, getUnreadCount]);

  // Mark conversation as read - use useUnreadMessages hook
  const markAsRead = useCallback(async (guestId: string) => {
    if (!userId) return;
    
    // Use the markConversationAsRead from useUnreadMessages hook
    await markConversationAsRead(guestId, userId);
    
    // Also mark all messages from this guest as read in local history
    setConversationHistory(prev => {
      const newHistory = new Map(prev);
      const guestHistory = newHistory.get(guestId) || [];
      const updatedHistory = guestHistory.map(msg => 
        msg.senderId === guestId
          ? { ...msg, isRead: true, isDelivered: true }
          : msg
      );
      newHistory.set(guestId, updatedHistory);
      return newHistory;
    });
  }, [userId, markConversationAsRead]);

  // Load conversation data when needed
  const loadConversationData = useCallback(async (guestId: string) => {
    if (!userId || !fetchChatHistory) return;
    
    try {
      const history = await fetchChatHistory(userId, guestId);
      setConversationHistory((prev: Map<string, ChatMessage[]>) => {
        const newHistory = new Map(prev);
        newHistory.set(guestId, Array.isArray(history) ? history : []);
        return newHistory;
      });
    } catch (error) {
      console.error('Error loading guest conversation:', error);
    }
  }, [userId, fetchChatHistory]);

  // Save conversation history to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const historyObj = Object.fromEntries(conversationHistory);
      sessionStorage.setItem(`guestConversationHistory_${userId}`, JSON.stringify(historyObj));
    } catch (error) {
      console.error('Error saving guest conversation history:', error);
    }
  }, [conversationHistory, userId]);

  // Enhanced refresh function that also refreshes unread counts
  const refreshGuests = useCallback(() => {
    if (fetchGuests) {
      // Refresh guest list
      fetchGuests();
      // Also refresh unread counts
      refreshUnreadCounts();
    }
  }, [fetchGuests, refreshUnreadCounts]);

  return {
    conversations: guestConversations,
    loading,
    markAsRead,
    loadConversationData,
    totalCount: guestConversations.length,
    refreshGuests
  };
};