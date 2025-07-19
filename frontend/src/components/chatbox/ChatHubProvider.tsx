import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createChatConnection } from '@/services/chatHub';
import { useAuth } from '@/hooks/useAuth';
import axiosInstance from '@/lib/axios';

export interface ChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (receiverId: string, message: string) => void;
  fetchChatHistory: (userId: string, receiverId: string) => Promise<ChatMessage[]>;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  fetchChatHistory: async () => [],
});

export const ChatHubProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const connectionRef = useRef<any>(null);

  useEffect(() => {
    if (!token || !userId || connectionRef.current) return;

    const connection = createChatConnection(token);
    connectionRef.current = connection;

    connection.on('ReceiveMessage', (senderId: string, message: string, receiverId?: string, timestamp?: string) => {
      setMessages(prev => [...prev, { senderId, receiverId: receiverId || '', message, timestamp }]);
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop().then(() => {
        connectionRef.current = null;
      });
    };
  }, [token, userId]);

  const sendMessage = (receiverId: string, message: string) => {
    connectionRef.current?.invoke('SendMessageToUser', receiverId, message).catch(console.error);
  };

  const fetchChatHistory = async (userId: string, receiverId: string): Promise<ChatMessage[]> => {
    try {
      const res = await axiosInstance.get('/chats/history', {
        params: { user1: userId, user2: receiverId },
      });
      return res.data || [];
    } catch (err) {
      console.error('Không thể tải lịch sử chat:', err);
      return [];
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, fetchChatHistory }}>
      {children}
    </ChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatHub = () => useContext(ChatContext);