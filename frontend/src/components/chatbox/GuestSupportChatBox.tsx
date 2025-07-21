import React, { useMemo, useRef, useState, useEffect } from "react";
import { useChatHub } from "@/components/chatbox/ChatHubProvider";

type Props = {
  onClose?: () => void;
};

export default function GuestSupportChatBox({ onClose }: Props) {
  const { messages, sendMessage } = useChatHub();
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const CONSULTANT_ID = "10"; // hardcoded consultant ID

  // 1. Group messages theo guestId
  const messagesMap = useMemo(() => {
    const map: Record<string, typeof messages> = {};
    messages.forEach((msg) => {
      const guestId = msg.senderId === CONSULTANT_ID ? msg.receiverId : msg.senderId;
      if (!map[guestId]) map[guestId] = [];
      map[guestId].push(msg);
    });
    return map;
  }, [messages]);

  // 2. Generate guest list từ messages
  const guestList = useMemo(() => Object.keys(messagesMap), [messagesMap]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, selectedGuestId]);

  const handleSend = () => {
    if (input.trim() && selectedGuestId) {
      sendMessage(selectedGuestId, input);
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
        {guestList.map((guestId) => (
          <div
            key={guestId}
            onClick={() => setSelectedGuestId(guestId)}
            style={{
              padding: "8px 10px",
              cursor: "pointer",
              borderRadius: 8,
              background: selectedGuestId === guestId ? "#2563eb" : "#fff",
              color: selectedGuestId === guestId ? "#fff" : "#111",
              marginBottom: 6,
              fontSize: 14,
              transition: "all 0.2s",
              wordBreak: "break-all",
            }}
            title={guestId}
          >
            {guestId.slice(0, 8)}...
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

        {selectedGuestId ? (
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
              {(messagesMap[selectedGuestId] || []).map(
                (msg: {
                  senderId: string;
                  receiverId: string;
                  message: string;
                  timestamp?: string;
                }, i: number) => (
                <div
                  key={i}
                  style={{
                    alignSelf:
                      msg.senderId === CONSULTANT_ID ? "flex-end" : "flex-start",
                    background:
                      msg.senderId === CONSULTANT_ID ? "#2563eb" : "#e0e7ff",
                    color:
                      msg.senderId === CONSULTANT_ID ? "#fff" : "#1e293b",
                    borderRadius: 12,
                    padding: "8px 14px",
                    maxWidth: "75%",
                    boxShadow:
                      msg.senderId === CONSULTANT_ID
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
                        msg.senderId === CONSULTANT_ID ? "#cbd5e1" : "#64748b",
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
