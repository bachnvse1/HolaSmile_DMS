import { useEffect, useRef, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatHubGuest } from "@/hooks/useChatHub";

const CONSULTANT = { id: "10", name: "Nhân viên tư vấn" };

type ChatMessage = {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
};

// ✅ Lấy hoặc tạo guestId ngay khi load file
function getOrCreateGuestId(): string {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("guestId", id);
  }
  return id;
}

export default function ConsultantChatBox() {
  const guestId = getOrCreateGuestId(); // ✅ Luôn có giá trị ngay từ đầu
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Khởi tạo chat hook
  const { realtimeMessages, sendMessage, fetchChatHistory } = useChatHubGuest(guestId);

  // 📜 Lấy lịch sử chat
  useEffect(() => {
    fetchChatHistory(CONSULTANT.id).then(setHistory);
  }, [guestId, fetchChatHistory]);

  // 🔁 Gộp lịch sử và tin nhắn realtime
  const allMessages = useMemo(() => {
    const merged = [
      ...history,
      ...realtimeMessages.filter(
        (m) =>
          (m.senderId === guestId && m.receiverId === CONSULTANT.id) ||
          (m.receiverId === guestId && m.senderId === CONSULTANT.id)
      ),
    ];
    return merged.sort((a, b) =>
      new Date(a.timestamp || "").getTime() -
      new Date(b.timestamp || "").getTime()
    );
  }, [history, realtimeMessages, guestId]);

  // 🔽 Scroll cuối sau mỗi tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      style={{
        width: 350,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        fontFamily: "inherit",
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 8,
          color: "#2563eb",
          letterSpacing: 0.5,
        }}
      >
        🎧 Chat với nhân viên tư vấn
      </div>
      <div
        style={{
          height: 240,
          overflowY: "auto",
          background: "#f6f8fa",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {allMessages.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Chưa có tin nhắn nào
          </div>
        )}
        {allMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.senderId === guestId ? "flex-end" : "flex-start",
              background: msg.senderId === guestId ? "#2563eb" : "#e0e7ff",
              color: msg.senderId === guestId ? "#fff" : "#1e293b",
              borderRadius: 12,
              padding: "8px 14px",
              maxWidth: "80%",
              boxShadow:
                msg.senderId === guestId
                  ? "0 2px 8px #2563eb22"
                  : "0 2px 8px #64748b22",
              marginBottom: 2,
              fontSize: 15,
              wordBreak: "break-word",
              position: "relative",
            }}
            title={msg.senderId === guestId ? "Bạn" : CONSULTANT.name}
          >
            <span style={{ fontWeight: 500 }}>
              {msg.senderId === guestId ? "Bạn" : CONSULTANT.name}:
            </span>{" "}
            {msg.message}
            <span
              style={{
                display: "block",
                fontSize: 11,
                color: "#cbd5e1",
                marginTop: 2,
                textAlign: "right",
              }}
            >
              {formatTime(msg.timestamp)}
            </span>
          </div>
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
            padding: "8px 10px",
            fontSize: 15,
            outline: "none",
            background: "#f9fafb",
            transition: "border 0.2s",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input) {
              sendMessage(input);
              setInput("");
            }
          }}
        />
        <button
          onClick={() => {
            if (input) {
              sendMessage(input);
              setInput("");
            }
          }}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 15,
            cursor: input ? "pointer" : "not-allowed",
            opacity: input ? 1 : 0.6,
            boxShadow: "0 2px 8px #2563eb22",
            transition: "background 0.2s",
          }}
          disabled={!input}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
