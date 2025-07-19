import { useEffect, useRef, useState } from "react";
import { createChatConnection } from "@/services/chatHub";

export interface ChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

export function useChatHub(token: string, receiverId: string) {
  const connectionRef = useRef<ReturnType<typeof createChatConnection> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages([]); // 👈 Reset khi receiver đổi
  }, [receiverId]);

  useEffect(() => {
    const connection = createChatConnection(token);
    connection.on("ReceiveMessage", (senderId: string, message: string, _receiverId?: string, timestamp?: string) => {
      // Chỉ nhận tin đúng receiver hiện tại
      if (_receiverId === receiverId || senderId === receiverId) {
        setMessages(prev => [...prev, { senderId, receiverId: _receiverId || "", message, timestamp }]);
      }
    });
    connection.start().catch(console.error);
    connectionRef.current = connection;
    return () => {
      connection.stop();
    };
  }, [token, receiverId]);

  const sendMessage = (receiverId: string, msg: string) => {
    connectionRef.current?.invoke("SendMessageToUser", receiverId, msg);
  };

  return { messages, sendMessage };
}
