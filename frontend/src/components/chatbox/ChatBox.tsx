import { useEffect, useRef, useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import dayjs from "dayjs";

type Receiver = {
  id: string;
  name: string;
};

type ChatMessage = {
  messageId?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
};

type Props = {
  receiver: Receiver;
  messages: ChatMessage[]; // Nhận từ parent, không cần fetch lại
  sendMessage: (receiverId: string, msg: string) => void;
};

// Memoize MessageItem để tránh re-render
const MessageItem = memo(({ 
  message, 
  isMine 
}: { 
  message: ChatMessage; 
  isMine: boolean; 
}) => (
  <div
    style={{
      alignSelf: isMine ? "flex-end" : "flex-start",
      background: isMine ? "#2563eb" : "#e0e7ff",
      color: isMine ? "#fff" : "#1e293b",
      borderRadius: 16,
      padding: "8px 12px",
      maxWidth: "80%",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    }}
  >
    <div style={{ fontSize: 15, wordBreak: "break-word" }}>{message.message}</div>
    <div style={{ fontSize: 11, marginTop: 4, textAlign: "right", opacity: 0.6 }}>
      {message.timestamp ? dayjs(message.timestamp).format("HH:mm") : ""}
    </div>
  </div>
));

export default memo(function ChatBox({ receiver, messages, sendMessage }: Props) {
  const { userId } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll với throttle
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && receiver.id) {
      sendMessage(receiver.id, trimmedInput);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        fontFamily: "inherit",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#2563eb" }}>
        💬 Chat với {receiver.name}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#f6f8fa",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Chưa có tin nhắn nào
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageItem
            key={msg.messageId || `${msg.senderId}-${msg.timestamp}-${i}`}
            message={msg}
            isMine={msg.senderId === userId}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 15,
            background: "#fff",
            outline: "none",
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          style={{
            background: input.trim() ? "#2563eb" : "#94a3b8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: 15,
            cursor: input.trim() ? "pointer" : "not-allowed",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
          disabled={!input.trim()}
        >
          Gửi
        </button>
      </div>
    </div>
  );
});