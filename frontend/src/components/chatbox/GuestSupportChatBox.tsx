import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatHub } from "@/components/chatbox/ChatHubProvider";
import type { ChatMessage } from "@/hooks/useChatHubGuest";

type Props = {
  onClose?: () => void;
};

type GuestInfo = {
  guestId: string;
  name?: string;
  lastMessageAt?: string;
};

export default function GuestSupportChatBox({ onClose }: Props) {
  const { userId } = useAuth();
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

  // Cache để tránh fetch guests liên tục
  const lastFetchTime = useRef<number>(0);
  const FETCH_INTERVAL = 30000; // 30 giây

  // Fetch guests với cache
  const fetchGuests = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < FETCH_INTERVAL) {
      return; // Skip nếu chưa đủ thời gian
    }

    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { fetchUsers } = useChatHub();
      await fetchUsers(); // Sử dụng cache từ provider
      lastFetchTime.current = now;
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  }, []);

  // Fetch guests chỉ một lần khi mount
  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // Fetch history chỉ khi selectedGuest thay đổi
  useEffect(() => {
    if (!userId || !selectedGuest?.guestId) {
      setHistory([]);
      return;
    }

    let isCancelled = false;
    
    fetchChatHistory(userId, selectedGuest.guestId).then(data => {
      if (!isCancelled) {
        setHistory(data);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedGuest?.guestId, userId, fetchChatHistory]);

  // Memoize allMessages để tránh tính toán lại không cần thiết
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

    // Loại bỏ duplicate với hiệu suất tốt hơn
    const seen = new Set();
    const unique = merged.filter(msg => {
      const key = `${msg.senderId}-${msg.receiverId}-${msg.message}-${msg.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort(
      (a, b) =>
        new Date(a.timestamp || "").getTime() -
        new Date(b.timestamp || "").getTime()
    );
  }, [history, realtimeMessages, selectedGuest, userId]);

  // Auto scroll với throttle
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
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
  }, [allMessages.length]);

  const handleSend = useCallback(() => {
    const trimmedInput = input.trim();
    if (trimmedInput && selectedGuest) {
      sendMessage(selectedGuest.guestId, trimmedInput);
      setInput("");
    }
  }, [input, selectedGuest, sendMessage]);

  const formatTime = useCallback((ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

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
                  key={`${msg.senderId}-${msg.timestamp}-${i}`}
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
