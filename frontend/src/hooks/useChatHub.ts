import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import axiosInstance from '@/lib/axios';

export interface ChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

export function useChatHub(token: string) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);

  // 🔗 Khởi tạo SignalR duy nhất
  useEffect(() => {
    if (!token || connectionRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5001/chat', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (senderId: string, message: string, receiverId?: string, timestamp?: string) => {
      setRealtimeMessages(prev => [...prev, { senderId, receiverId: receiverId || '', message, timestamp }]);
    });

    connection.on('messagesent', () => {
      // No-op
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop();
    };
  }, [token]);

  const sendMessage = (receiverId: string, message: string) => {
    connectionRef.current?.invoke('SendMessageToUser', receiverId, message).catch(console.error);
  };

  const fetchChatHistory = async (userId: string, receiverId: string): Promise<ChatMessage[]> => {
    try {
      const res = await axiosInstance.get('/chats/history', {
        params: {
          user1: userId,
          user2: receiverId,
        },
      });
      return res.data || [];
    } catch (err) {
      console.error('Không thể tải lịch sử chat:', err);
      return [];
    }
  };

  return {
    realtimeMessages,
    sendMessage,
    fetchChatHistory,
  };
}