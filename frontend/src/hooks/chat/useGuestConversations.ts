import { useState, useEffect, useMemo, useCallback } from 'react';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useAuth } from '@/hooks/useAuth';

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

  const [conversationHistory, setConversationHistory] = useState<Map<string, ChatMessage[]>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

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
    
    // Load unread counts
    try {
      const saved = sessionStorage.getItem(`guestUnreadCounts_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUnreadCounts(new Map(Object.entries(parsed).map(([k, v]) => [k, Number(v)])));
      } else {
        setUnreadCounts(new Map());
      }
    } catch (error) {
      console.error('Error restoring guest unread counts:', error);
      setUnreadCounts(new Map());
    }
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

  // Handle new messages for unread count
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;
    
    const lastMessage = realtimeMessages[realtimeMessages.length - 1];
    
    // Only count unread if message is TO current user (not FROM current user)
    if (lastMessage.receiverId === userId && lastMessage.senderId !== userId) {
      // Only process if this is a truly new message (not from reload)
      const messageKey = `${lastMessage.senderId}-${lastMessage.receiverId}-${lastMessage.timestamp}`;
      const processedMessages = JSON.parse(sessionStorage.getItem(`processedGuestMessages_${userId}`) || '[]');
      
      if (!processedMessages.includes(messageKey)) {
        // Mark message as processed
        processedMessages.push(messageKey);
        if (processedMessages.length > 100) {
          processedMessages.splice(0, processedMessages.length - 100);
        }
        sessionStorage.setItem(`processedGuestMessages_${userId}`, JSON.stringify(processedMessages));
        
        // Increment unread count for sender (guest)
        setUnreadCounts(prev => {
          const newCounts = new Map(prev);
          const currentCount = newCounts.get(lastMessage.senderId) || 0;
          newCounts.set(lastMessage.senderId, currentCount + 1);
          return newCounts;
        });
      }
    }
  }, [realtimeMessages, userId]);

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
      
      // Get stored unread count (this includes real-time updates)
      const storedUnreadCount = unreadCounts.get(guest.guestId) || 0;
      
      // Always add guest to conversation list
      conversations.push({
        guestId: guest.guestId,
        name: guest.name || `Khách ${guest.guestId.slice(0, 8)}`,
        phoneNumber: undefined,
        email: undefined,
        lastMessageAt: lastMessage?.timestamp || undefined,
        lastMessage: lastMessage || undefined,
        unreadCount: storedUnreadCount
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
  }, [guests, userId, conversationHistory, realtimeMessages, unreadCounts]);

  // Mark conversation as read - clear unread count
  const markAsRead = useCallback((guestId: string) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.set(guestId, 0);
      return newCounts;
    });
    
    // Also mark all messages from this guest as read
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
  }, []);

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

  // Save unread counts to sessionStorage
  useEffect(() => {
    if (!userId) return;
    try {
      const countsObj = Object.fromEntries(unreadCounts);
      sessionStorage.setItem(`guestUnreadCounts_${userId}`, JSON.stringify(countsObj));
    } catch (error) {
      console.error('Error saving guest unread counts:', error);
    }
  }, [unreadCounts, userId]);

  return {
    conversations: guestConversations,
    loading,
    markAsRead,
    loadConversationData,
    totalCount: guestConversations.length,
    refreshGuests: fetchGuests
  };
};