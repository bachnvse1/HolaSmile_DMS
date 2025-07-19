import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

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
  messages: ChatMessage[]; // realtime từ socket
  sendMessage: (receiverId: string, msg: string, messageId: string) => void; // 👈 thêm messageId
};

export default function ChatBox({ receiver, messages, sendMessage }: Props) {
  const { userId } = useAuth();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 📥 Load lịch sử từ server
  useEffect(() => {
    const fetchHistory = async () => {
      if (userId && receiver?.id) {
        try {
          const res = await axiosInstance.get("/chats/history", {
            params: { user1: userId, user2: receiver.id },
          });
          setHistory(res.data || []);
        } catch {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    };
    fetchHistory();
  }, [userId, receiver?.id]);

  // 📦 Gộp lịch sử + realtime (KHÔNG dùng localSent)
  const allMessages = useMemo(() => {
    if (!receiver?.id) return [];

    const realtimeMsgs = messages.filter(
      (m) =>
        (m.senderId === userId && m.receiverId === receiver.id) ||
        (m.senderId === receiver.id && m.receiverId === userId)
    );

    const merged = [...history, ...realtimeMsgs];

    const unique = merged.filter((msg, idx, arr) =>
      arr.findIndex((m) =>
        m.messageId
          ? m.messageId === msg.messageId
          : (
              m.senderId === msg.senderId &&
              m.receiverId === msg.receiverId &&
              m.message === msg.message &&
              new Date(m.timestamp || '').toISOString() === new Date(msg.timestamp || '').toISOString()
            )
      ) === idx
    );

    unique.sort((a, b) =>
      a.timestamp && b.timestamp
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : 0
    );

    return unique;
  }, [history, messages, userId, receiver?.id]);

  // 🔽 Tự scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // 📤 Gửi tin nhắn (KHÔNG thêm vào local)
  const handleSend = () => {
    if (input.trim()) {
      const messageId = uuidv4();
      sendMessage(receiver.id, input.trim(), messageId);
      setInput("");
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
        {allMessages.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Chưa có tin nhắn nào
          </div>
        )}

        {allMessages.map((msg) => {
          const isMine = msg.senderId === userId;
          return (
            <div
              key={msg.messageId || `${msg.senderId}-${msg.timestamp}-${msg.message}`}
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
              <div style={{ fontSize: 15, wordBreak: "break-word" }}>{msg.message}</div>
              <div style={{ fontSize: 11, marginTop: 4, textAlign: "right", opacity: 0.6 }}>
                {msg.timestamp ? dayjs(msg.timestamp).format("HH:mm") : ""}
              </div>
            </div>
          );
        })}

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
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: 15,
            cursor: input ? "pointer" : "not-allowed",
            opacity: input ? 1 : 0.6,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
          disabled={!input}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}