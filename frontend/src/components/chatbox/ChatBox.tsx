
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatHub } from "@/hooks/useChatHub";
import axiosInstance from "@/lib/axios";


export default function ChatBox() {
  const { token, userId } = useAuth();
  const { messages, sendMessage } = useChatHub(token ?? "");
  const [input, setInput] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  // Lấy lịch sử chat khi chọn receiverId
  useEffect(() => {
    const fetchHistory = async () => {
      if (userId && receiverId) {
        try {
          const res = await axiosInstance.get("/chats/history", {
            params: { user1: userId, user2: receiverId },
          });
          setHistory(res.data || []);
        } catch (e) {
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    };
    fetchHistory();
  }, [userId, receiverId]);

  // Gộp lịch sử và tin nhắn realtime, tránh trùng lặp
  const allMessages = React.useMemo(() => {
    // Chỉ merge nếu có receiverId
    if (!receiverId) return [];
    // Lấy id đã có từ messages realtime
    const realTimeMsgs = messages.filter(m =>
      (m.senderId === userId && m.receiverId === receiverId) ||
      (m.senderId === receiverId && m.receiverId === userId)
    );
    // Lịch sử có thể chưa có receiverId, nên map lại cho đồng nhất
    const historyMsgs = history.map((m: any) => ({
      senderId: m.senderId,
      receiverId: m.receiverId,
      message: m.message,
      timestamp: m.timestamp,
    }));
    // Gộp và loại trùng theo timestamp + senderId + message
    const merged = [...historyMsgs, ...realTimeMsgs];
    const unique = merged.filter((msg, idx, arr) =>
      arr.findIndex(m => m.senderId === msg.senderId && m.receiverId === msg.receiverId && m.message === msg.message && m.timestamp === msg.timestamp) === idx
    );
    // Sắp xếp theo thời gian nếu có timestamp
    unique.sort((a, b) => (a.timestamp && b.timestamp ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() : 0));
    return unique;
  }, [history, messages, userId, receiverId]);

  return (
    <div
      style={{
        width: 350,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#2563eb', letterSpacing: 0.5 }}>💬 Chat trực tuyến</div>
      <div
        style={{
          height: 240,
          overflowY: 'auto',
          background: '#f6f8fa',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {allMessages.length === 0 && (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Chưa có tin nhắn nào</div>
        )}
        {allMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.senderId === userId ? 'flex-end' : 'flex-start',
              background: msg.senderId === userId ? '#2563eb' : '#e0e7ff',
              color: msg.senderId === userId ? '#fff' : '#1e293b',
              borderRadius: 12,
              padding: '8px 14px',
              maxWidth: '80%',
              boxShadow: msg.senderId === userId ? '0 2px 8px #2563eb22' : '0 2px 8px #64748b22',
              marginBottom: 2,
              fontSize: 15,
              wordBreak: 'break-word',
            }}
            title={msg.senderId === userId ? 'Bạn' : msg.senderId}
          >
            <span style={{ fontWeight: 500 }}>{msg.senderId === userId ? 'Bạn' : msg.senderId}:</span> {msg.message}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={receiverId}
          onChange={e => setReceiverId(e.target.value)}
          placeholder="ID người nhận"
          style={{
            flex: 1,
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 15,
            outline: 'none',
            background: '#f9fafb',
            transition: 'border 0.2s',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 15,
            outline: 'none',
            background: '#f9fafb',
            transition: 'border 0.2s',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && receiverId && input) {
              sendMessage(receiverId, input);
              setInput('');
            }
          }}
        />
        <button
          onClick={() => {
            if (receiverId && input) {
              sendMessage(receiverId, input);
              setInput('');
            }
          }}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 15,
            cursor: receiverId && input ? 'pointer' : 'not-allowed',
            opacity: receiverId && input ? 1 : 0.6,
            boxShadow: '0 2px 8px #2563eb22',
            transition: 'background 0.2s',
          }}
          disabled={!receiverId || !input}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}