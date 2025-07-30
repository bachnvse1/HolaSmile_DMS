import { useState, useEffect, useCallback } from 'react';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useAuth } from '@/hooks/useAuth';

export const useRealtimeUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { messages: realtimeMessages } = useChatHub();
  const { userId } = useAuth();

  // Đếm tin nhắn mới nhận được (chưa đọc)
  const updateUnreadCount = useCallback(() => {
    if (!userId || !realtimeMessages.length) {
      setUnreadCount(0);
      return;
    }

    // Đếm tin nhắn gửi đến user hiện tại (receiverId === userId)
    const newMessages = realtimeMessages.filter(msg => 
      msg.receiverId === userId && 
      msg.senderId !== userId // Không đếm tin nhắn của chính mình
    );
    
    setUnreadCount(newMessages.length);
  }, [userId, realtimeMessages]);

  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Reset unread count khi user đọc tin nhắn
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    markAsRead
  };
};