import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createChatConnection } from '@/services/chatHub';
import { useAuth } from '@/hooks/useAuth';
import axiosInstance from '@/lib/axios';

export interface ChatMessage {
  messageId?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

type GuestInfo = {
  guestId: string;
  name?: string;
  lastMessageAt?: string;
};

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (receiverId: string, message: string) => void;
  fetchChatHistory: (userId: string, receiverId: string) => Promise<ChatMessage[]>;
  // Thêm cache management
  clearHistoryCache: (key: string) => void;
  users: any[];
  fetchUsers: () => Promise<void>;
  guests: GuestInfo[];
  fetchGuests: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  fetchChatHistory: async () => [],
  clearHistoryCache: () => {},
  users: [],
  fetchUsers: async () => {},
  guests: [],
  fetchGuests: async () => {},
});

export const ChatHubProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const connectionRef = useRef<any>(null);
  
  // Cache cho history để tránh gọi API liên tục
  const historyCache = useRef<Map<string, { data: ChatMessage[], timestamp: number }>>(new Map());
  const usersCache = useRef<{ data: any[], timestamp: number } | null>(null);
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const guestsCache = useRef<{ data: GuestInfo[], timestamp: number } | null>(null);


  const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

  useEffect(() => {
    if (!token || !userId || connectionRef.current) return;

    const connection = createChatConnection(token);
    connectionRef.current = connection;

    connection.on('ReceiveMessage', (senderId: string, message: string, receiverId?: string, timestamp?: string) => {
      const newMessage = { 
        messageId: `${Date.now()}-${Math.random()}`,
        senderId, 
        receiverId: receiverId || '', 
        message, 
        timestamp: timestamp || new Date().toISOString()
      };
      
      setMessages(prev => {
        // Tránh duplicate messages
        const exists = prev.some(m => 
          m.senderId === newMessage.senderId && 
          m.message === newMessage.message &&
          Math.abs(new Date(m.timestamp || '').getTime() - new Date(newMessage.timestamp).getTime()) < 1000
        );
        
        if (exists) return prev;
        return [...prev, newMessage];
      });

      // Xóa cache history khi có tin nhắn mới
      const cacheKey = [senderId, receiverId].sort().join('-');
      historyCache.current.delete(cacheKey);
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop().then(() => {
        connectionRef.current = null;
      });
    };
  }, [token, userId]);

  const sendMessage = useCallback((receiverId: string, message: string) => {
    if (!connectionRef.current || !message.trim()) return;
    
    connectionRef.current.invoke('SendMessage', receiverId, message.trim(), false)
      .catch(console.error);
  }, []);

  const fetchChatHistory = useCallback(async (userId: string, receiverId: string): Promise<ChatMessage[]> => {
    const cacheKey = [userId, receiverId].sort().join('-');
    const cached = historyCache.current.get(cacheKey);
    
    // Kiểm tra cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const res = await axiosInstance.get('/chats/history', {
        params: { user1: userId, user2: receiverId },
      });
      
      const data = res.data || [];
      // Lưu vào cache
      historyCache.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (err) {
      console.error('Không thể tải lịch sử chat:', err);
      return [];
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    // Kiểm tra cache users
    if (usersCache.current && Date.now() - usersCache.current.timestamp < CACHE_DURATION) {
      return;
    }

    try {
      const res = await axiosInstance.get('/user/allUsersChat');
      const userData = res.data || [];
      
      setUsers(userData);
      usersCache.current = {
        data: userData,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error('Không thể tải danh sách users:', err);
      setUsers([]);
    }
  }, []);


    const fetchGuests = useCallback(async () => {
      if (guestsCache.current && Date.now() - guestsCache.current.timestamp < CACHE_DURATION) {
        return; // dùng cache
      }

      try {
        const res = await axiosInstance.get('/user/allGuestsChat');
        const guestData = res.data || [];

        setGuests(guestData);
        guestsCache.current = {
          data: guestData,
          timestamp: Date.now(),
        };
      } catch (err) {
        console.error('Không thể tải danh sách guests:', err);
        setGuests([]);
      }
    }, []);


  const clearHistoryCache = useCallback((key: string) => {
    historyCache.current.delete(key);
  }, []);

  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage, 
      fetchChatHistory, 
      clearHistoryCache,
      users,
      fetchUsers,
      guests,
      fetchGuests
    }}>
      {children}
</ChatContext.Provider>

  );
};

export const useChatHub = () => useContext(ChatContext);