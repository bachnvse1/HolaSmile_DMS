import { useState, useEffect, useCallback } from 'react';

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
      const response = await fetch(`/api/chats/unread-count?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCounts(data || []);
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
      const response = await fetch('/api/chats/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senderId, receiverId }),
      });

      if (response.ok) {
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

  // Initial fetch
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  return {
    unreadCounts,
    loading,
    markAsRead,
    getUnreadCount,
    addUnreadMessage,
    refreshUnreadCounts: fetchUnreadCounts
  };
};