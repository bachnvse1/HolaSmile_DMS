import { useEffect, useRef, useState } from "react";
import { createChatConnection } from "@/services/chatHub";

export interface ChatMessage {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

export function useChatHub(token: string) {
  const connectionRef = useRef<ReturnType<typeof createChatConnection> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const connection = createChatConnection(token);
    connection.on("ReceiveMessage", (senderId: string, message: string, receiverId?: string, timestamp?: string) => {
      setMessages(prev => [...prev, { senderId, receiverId: receiverId || "", message, timestamp }]);
    });
    connection.start().catch(console.error);
    connectionRef.current = connection;
    return () => {
      connection.stop();
    };
  }, [token]);

  const sendMessage = (receiverId: string, msg: string) => {
    connectionRef.current?.invoke("SendMessageToUser", receiverId, msg);
  };

  return { messages, sendMessage };
}