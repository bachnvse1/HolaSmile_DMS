import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import axiosInstance from '@/lib/axios';

export interface ChatMessage {
  messageId?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

/**
 * Hook SignalR cho khách truy cập (guest)
 * @param guestId: ID định danh khách (UUID) – bắt buộc
 */
export function useChatHubGuest(guestId: string) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);

  // 🔌 Kết nối SignalR 1 lần
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL_Not_Api;
    const hubUrl = `${baseURL}/chat?guestId=${guestId}`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (senderId: string, message: string, receiverId: string, timestamp?: string) => {
      setRealtimeMessages(prev => [...prev, { senderId, receiverId: receiverId || '', message, timestamp }]);
    });

    connection.on('MessageSent', () => {});

    connection.start()
      .then(() => {
      })
      .catch(err => {
        console.error('❌ SignalR failed to connect:', err);
      });

    connection.onclose(err => {
      console.warn('⚠️ SignalR disconnected:', err);
    });

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected || connection.state === signalR.HubConnectionState.Connecting) {
        connection.stop();
      }
    };
  }, [guestId]);

  // 📤 Gửi tin nhắn đến tư vấn viên
  const CONSULTANT_ID = '10';

  const sendMessage = (message: string) => {
    if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
      console.warn('⚠️ SignalR not connected yet');
      return;
    }

    connectionRef.current
      .invoke('SendMessage', CONSULTANT_ID, message, true) // true = isGuestSender
      .then(() => {
      })
      .catch(err => {
        console.error('❌ Failed to send message via SignalR:', err);
      });
  };

  // 📦 Lấy lịch sử chat giữa guest và consultant
  const fetchChatHistory = useCallback(async (consultantId: string): Promise<ChatMessage[]> => {
    try {
      const res = await axiosInstance.get('/chats/history', {
        params: {
          user1: guestId,
          user2: consultantId,
        },
      });
      return res.data || [];
    } catch (err) {
      console.error('❌ Không thể tải lịch sử chat:', err);
      return [];
    }
  }, [guestId]);

  return {
    realtimeMessages,
    sendMessage,
    fetchChatHistory,
  };
}
