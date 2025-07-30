import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/lib/axios';

interface UnreadCount {
  senderId: string;
  unreadCount: number;
}

export const useUnreadMessages = (userId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread counts từ API
  const fetchUnreadCounts = useCallback(async () => {
    if (!userId) {
      setUnreadCounts([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get('/chats/unread-count', {
        params: { userId },
        withCredentials: true
      });
      
      if (response.data) {
        setUnreadCounts(response.data || []);
      } else {
        console.error('Failed to fetch unread counts');
        setUnreadCounts([]);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      setUnreadCounts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark messages as read
  const markAsRead = useCallback(async (senderId: string, receiverId: string) => {
    try {
      const response = await axiosInstance.post('/chats/mark-as-read', {
        senderId,
        receiverId
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        // Remove unread count for this sender
        setUnreadCounts(prev => prev.filter(count => count.senderId !== senderId));
        return true;
      } else {
        console.error('Failed to mark messages as read');
        return false;
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, []);

  // Get unread count for specific sender
  const getUnreadCount = useCallback((senderId: string): number => {
    const count = unreadCounts.find(c => c.senderId === senderId);
    return count?.unreadCount || 0;
  }, [unreadCounts]);

  // Add unread count (when new message arrives)
  const addUnreadMessage = useCallback((senderId: string) => {
    setUnreadCounts(prev => {
      const existing = prev.find(c => c.senderId === senderId);
      if (existing) {
        return prev.map(c => 
          c.senderId === senderId 
            ? { ...c, unreadCount: c.unreadCount + 1 }
            : c
        );
      } else {
        return [...prev, { senderId, unreadCount: 1 }];
      }
    });
  }, []);

  // Mark message as delivered (new function)
  const markAsDelivered = useCallback(async (messageId: string) => {
    try {
      await axiosInstance.post('/api/chats/mark-as-delivered', {
        messageId
      }, {
        withCredentials: true
      });
      return true;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      return false;
    }
  }, []);

  // Bulk mark messages as read for conversation
  const markConversationAsRead = useCallback(async (otherUserId: string) => {
    try {
      const response = await axiosInstance.post('/api/chats/mark-conversation-read', {
        userId,
        otherUserId
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        // Remove unread count for this conversation
        setUnreadCounts(prev => prev.filter(count => count.senderId !== otherUserId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return false;
    }
  }, [userId]);

  // Get total unread count across all conversations
  const getTotalUnreadCount = useCallback((): number => {
    return unreadCounts.reduce((total, count) => total + count.unreadCount, 0);
  }, [unreadCounts]);

  // Clear all unread counts (when user goes offline/online)
  const clearAllUnreadCounts = useCallback(() => {
    setUnreadCounts([]);
  }, []);

  // Update unread count for specific sender (for real-time updates)
  const updateUnreadCount = useCallback((senderId: string, newCount: number) => {
    setUnreadCounts(prev => {
      const existing = prev.find(c => c.senderId === senderId);
      if (existing) {
        if (newCount === 0) {
          return prev.filter(c => c.senderId !== senderId);
        }
        return prev.map(c => 
          c.senderId === senderId 
            ? { ...c, unreadCount: newCount }
            : c
        );
      } else if (newCount > 0) {
        return [...prev, { senderId, unreadCount: newCount }];
      }
      return prev;
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    loading,
    markAsRead,
    markAsDelivered,
    markConversationAsRead,
    getUnreadCount,
    getTotalUnreadCount,
    addUnreadMessage,
    updateUnreadCount,
    clearAllUnreadCounts,
    refreshUnreadCounts: fetchUnreadCounts
  };
};