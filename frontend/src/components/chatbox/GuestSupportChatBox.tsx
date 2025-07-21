import React, { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useChatHub } from "@/components/chatbox/ChatHubProvider";
import type { ChatMessage } from "@/hooks/useChatHub";

type Props = {
  onClose?: () => void;
};

type GuestInfo = {
  guestId: string;
  name?: string;
  lastMessageAt?: string;
};

export default function GuestSupportChatBox({ onClose }: Props) {
  const { userId } = useAuth(); // Lấy consultant ID (ví dụ: "10")
  const {
    messages: realtimeMessages,
    sendMessage,
    fetchChatHistory,
  } = useChatHub();

  const [guestList, setGuestList] = useState<GuestInfo[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestInfo | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách khách
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await axiosInstance.get("/user/allGuestsChat");
        setGuestList(res.data || []);
      } catch {
        setGuestList([]);
      }
    };
    fetchGuests();
  }, []);

  // Lấy lịch sử chat khi chọn khách
  useEffect(() => {
    if (!userId || !selectedGuest?.guestId) return;
    fetchChatHistory(userId, selectedGuest.guestId).then(setHistory);
  }, [selectedGuest, userId, fetchChatHistory]);

  // Gộp lịch sử + tin nhắn realtime
const allMessages = useMemo(() => {
  if (!selectedGuest) return [];

  const merged = [
    ...history,
    ...realtimeMessages.filter(
      (m) =>
        (m.senderId === userId && m.receiverId === selectedGuest.guestId) ||
        (m.receiverId === userId && m.senderId === selectedGuest.guestId)
    ),
  ];

  const unique: ChatMessage[] = [];

  merged.forEach((msg) => {
    const isDuplicate = unique.some((m) => {
      const sameSender = m.senderId === msg.senderId;
      const sameReceiver = m.receiverId === msg.receiverId;
      const sameMessage = m.message.trim() === msg.message.trim();

      const timeA = new Date(m.timestamp || "").getTime();
      const timeB = new Date(msg.timestamp || "").getTime();
      const timeDiff = Math.abs(timeA - timeB);

      return sameSender && sameReceiver && sameMessage && timeDiff < 5000; // < 5s
    });

    if (!isDuplicate) {
      unique.push(msg);
    }
  });

  return unique.sort(
    (a, b) =>
      new Date(a.timestamp || "").getTime() -
      new Date(b.timestamp || "").getTime()
  );
}, [history, realtimeMessages, selectedGuest, userId]);


  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSend = () => {
    if (input.trim() && selectedGuest) {
      sendMessage(selectedGuest.guestId, input);
      setInput("");
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 96,
        right: 24,
        zIndex: 1000,
        display: "flex",
        height: 500,
        width: 700,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "inherit",
        background: "#fff",
      }}
    >
      {/* Danh sách khách */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #e5e7eb",
          padding: 12,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10, color: "#2563eb" }}>
          🧑‍💻 Khách tư vấn
        </div>
        {guestList.length === 0 && (
          <div style={{ color: "#888", fontSize: 14 }}>
            Chưa có tin nhắn nào từ khách
          </div>
        )}
        {guestList.map((guest) => (
          <div
            key={guest.guestId}
            onClick={() => setSelectedGuest(guest)}
            style={{
              padding: "8px 10px",
              cursor: "pointer",
              borderRadius: 8,
              background: selectedGuest?.guestId === guest.guestId ? "#2563eb" : "#fff",
              color: selectedGuest?.guestId === guest.guestId ? "#fff" : "#111",
              marginBottom: 6,
              fontSize: 14,
              transition: "all 0.2s",
              wordBreak: "break-all",
            }}
            title={guest.guestId}
          >
            <div>{guest.name || guest.guestId.slice(0, 8) + "..."}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {formatTime(guest.lastMessageAt)}
            </div>
          </div>
        ))}
      </div>

      {/* Chat box */}
      <div style={{ flex: 1, padding: 12, position: "relative" }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 1001,
            }}
          >
            ×
          </button>
        )}

        {selectedGuest ? (
          <>
            <div
              style={{
                height: 340,
                overflowY: "auto",
                background: "#f8fafc",
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {allMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf:
                      msg.senderId === userId ? "flex-end" : "flex-start",
                    background:
                      msg.senderId === userId ? "#2563eb" : "#e0e7ff",
                    color:
                      msg.senderId === userId ? "#fff" : "#1e293b",
                    borderRadius: 12,
                    padding: "8px 14px",
                    maxWidth: "75%",
                    boxShadow:
                      msg.senderId === userId
                        ? "0 2px 8px #2563eb22"
                        : "0 2px 8px #64748b22",
                    fontSize: 14,
                    wordBreak: "break-word",
                    position: "relative",
                  }}
                >
                  {msg.message}
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        msg.senderId === userId ? "#cbd5e1" : "#64748b",
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Gửi tin nhắn */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                style={{
                  flex: 1,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 15,
                  outline: "none",
                  background: "#f9fafb",
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
                  padding: "8px 18px",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  opacity: input.trim() ? 1 : 0.6,
                  boxShadow: "0 2px 8px #2563eb22",
                }}
                disabled={!input.trim()}
              >
                Gửi
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#999", marginTop: 100 }}>
            Chọn một khách để bắt đầu trò chuyện
          </div>
        )}
      </div>
    </div>
  );
}
