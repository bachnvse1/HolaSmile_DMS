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
      if (history.length > 0) {
        setConversationHistory(prev => new Map(prev.set(guestId, history)));
      }
    } catch (error) {
      console.error('Error loading guest history:', error);
    }
  }, [userId, fetchChatHistory, conversationHistory]);

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
      const unreadCount = unreadCounts.get(guest.guestId) || 0;
      
      // Luôn luôn thêm guest vào danh sách (không check lastMessage)
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
    
    // Sort by last message time (newest first), then unread count
    conversations.sort((a, b) => {
      // Prioritize unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      
      // Then sort by last message time
      const timeA = new Date(a.lastMessageAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || 0).getTime();
      return timeB - timeA;
    });
    
    return conversations;
  }, [guests, userId, conversationHistory, realtimeMessages, unreadCounts]);

  // Handle new messages for unread count
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;
    
    const lastMessage = realtimeMessages[realtimeMessages.length - 1];
    if (lastMessage.receiverId === userId) {
      setUnreadCounts(prev => {
        const newCounts = new Map(prev);
        const currentCount = newCounts.get(lastMessage.senderId) || 0;
        newCounts.set(lastMessage.senderId, currentCount + 1);
        return newCounts;
      });
    }
  }, [realtimeMessages, userId]);

  // Mark conversation as read
  const markAsRead = useCallback((guestId: string) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.set(guestId, 0);
      return newCounts;
    });
  }, []);

  // Load conversation data when needed
  const loadConversationData = useCallback(async (guestId: string) => {
    await loadGuestHistory(guestId);
  }, [loadGuestHistory]);

  return {
    conversations: guestConversations,
    loading,
    markAsRead,
    loadConversationData,
    totalCount: guestConversations.length,
    refreshGuests: fetchGuests
  };
};