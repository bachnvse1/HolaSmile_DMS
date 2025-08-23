import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/lib/axios';

interface UnreadCount {
  senderId: string;
  unreadCount: number;
}

export const useUnreadMessages = (userId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread counts từ API với force refresh option
  const fetchUnreadCounts = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setUnreadCounts([]);
      return;
    }

    try {
      setLoading(true);
      
      // Add timestamp để force refresh cache
      const params: any = { userId };
      if (forceRefresh) {
        params._t = Date.now();
      }

      const response = await axiosInstance.get('/chats/unread-count', {
        params,
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

  // Auto refresh khi userId thay đổi (login/logout/F5)
  useEffect(() => {
    if (userId) {
      fetchUnreadCounts(true); // Force refresh on userId change
    } else {
      setUnreadCounts([]);
    }
  }, [userId, fetchUnreadCounts]);

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
        setUnreadCounts(prev => prev.filter(c => c.senderId !== senderId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }, []);

  // Bulk mark messages as read for conversation
  const markConversationAsRead = useCallback(async (otherUserId: string, currentUserId: string) => {
    try {
      const response = await axiosInstance.post('/chats/mark-conversation-read', {
        userId: currentUserId,
        otherUserId
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        // Remove unread count for this user
        setUnreadCounts(prev => prev.filter(c => c.senderId !== otherUserId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      
      // Fallback to mark-as-read
      return await markAsRead(otherUserId, currentUserId);
    }
  }, [markAsRead]);

  // Get unread count for specific sender
  const getUnreadCount = useCallback((senderId: string): number => {
    const count = unreadCounts.find(c => c.senderId === senderId);
    return count?.unreadCount || 0;
  }, [unreadCounts]);

  // Get total unread count across all conversations
  const getTotalUnreadCount = useCallback((): number => {
    return unreadCounts.reduce((total, count) => total + count.unreadCount, 0);
  }, [unreadCounts]);

  // Manual refresh function
  const refreshUnreadCounts = useCallback(() => {
    return fetchUnreadCounts(true);
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    loading,
    markAsRead,
    markConversationAsRead,
    getUnreadCount,
    getTotalUnreadCount,
    refreshUnreadCounts, 
    clearAllUnreadCounts: () => setUnreadCounts([])
  };
};