import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { TokenUtils } from '@/utils/tokenUtils';
import axiosInstance from '@/lib/axios';

export interface ChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

export function useChatHub(token: string, receiverId: string) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const latestReceiverIdRef = useRef(receiverId);
  useEffect(() => {
    latestReceiverIdRef.current = receiverId;
  }, [receiverId]);

  // 🔗 Khởi tạo SignalR 1 lần duy nhất
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

    connection.on('ReceiveMessage', (senderId: string, message: string, _receiverId?: string, timestamp?: string) => {
      const currentReceiverId = latestReceiverIdRef.current;
      if (_receiverId === currentReceiverId || senderId === currentReceiverId) {
        setMessages(prev => [...prev, { senderId, receiverId: _receiverId || '', message, timestamp }]);
      }
    });

    connection.on('messagesent', () => {
  // Để tránh warning
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop();
    };
  }, [token]);

  // 📥 Load lịch sử khi đổi receiver
  useEffect(() => {
    setMessages([]); // reset trước khi fetch
    const fetchHistory = async () => {
      if (!token || !receiverId) return;

      try {
        const res = await axiosInstance.get('/chats/history', {
          params: {
            user1: TokenUtils.getUserIdFromToken(token),
            user2: receiverId,
          },
        });
        const history = res.data || [];
        setMessages(history);
      } catch (err) {
        console.error('Không thể tải lịch sử chat:', err);
      }
    };

    fetchHistory();
  }, [receiverId, token]);

  const sendMessage = (receiverId: string, message: string) => {
    connectionRef.current?.invoke('SendMessageToUser', receiverId, message).catch(console.error);
  };

  return { messages, sendMessage };
}