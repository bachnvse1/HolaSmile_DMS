import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createChatConnection } from '@/services/chatHub';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

const ChatContext = createContext<{ messages: ChatMessage[] }>({ messages: [] });

export const ChatHubProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const connectionRef = useRef<any>(null);

  useEffect(() => {
    if (!token || !userId || connectionRef.current) return;

    const connection = createChatConnection(token);
    connectionRef.current = connection;

    connection.on('ReceiveMessage', (senderId: string, message: string, receiverId?: string, timestamp?: string) => {
      if (receiverId === userId) {
        setMessages(prev => [...prev, { senderId, receiverId, message, timestamp }]);
      }
    });

    connection.start().catch(console.error);
  }, [token, userId]);

  return <ChatContext.Provider value={{ messages }}>{children}</ChatContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatHub = () => useContext(ChatContext);
