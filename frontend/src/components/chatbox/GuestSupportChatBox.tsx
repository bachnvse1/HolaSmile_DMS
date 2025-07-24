import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatHub } from "@/components/chatbox/ChatHubProvider";
import type { ChatMessage } from "@/components/chatbox/ChatHubProvider";

// Define GuestInfo type if not imported from elsewhere
type GuestInfo = {
  guestId: string;
  name?: string;
  lastMessageAt?: string;
};

type Props = {
  onClose?: () => void;
};

export default function GuestSupportChatBox({ onClose }: Props) {
  const { userId } = useAuth();
  const chatHub = useChatHub();

  
  const {
    messages: realtimeMessages,
    sendMessage,
    fetchChatHistory,
    guests = [], // Default empty array để tránh undefined
    fetchGuests,
  } = chatHub;


  const [selectedGuest, setSelectedGuest] = useState<GuestInfo | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch guests với nhiều cách khác nhau
  useEffect(() => {
    
    if (fetchGuests && typeof fetchGuests === 'function') {
      setIsLoading(true);
      
      fetchGuests()
        .then(() => {
        })
        .catch((error) => {
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      console.warn('fetchGuests is not available or not a function');
    }
  }, [fetchGuests]);

  // Force refetch button
  const handleForceRefetch = useCallback(async () => {
    if (fetchGuests) {
      setIsLoading(true);
      try {
        await fetchGuests();
      } catch (error) {
        console.error('Force refetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [fetchGuests]);

  // Auto select first guest khi có guests
  useEffect(() => {
    if (!selectedGuest && Array.isArray(guests) && guests.length > 0) {
      setSelectedGuest(guests[0]);
    }
  }, [guests, selectedGuest]);

  // Fetch history chỉ khi selectedGuest thay đổi
  useEffect(() => {
    if (!userId || !selectedGuest?.guestId || !fetchChatHistory) {
      setHistory([]);
      return;
    }

    let isCancelled = false;
    
    fetchChatHistory(userId, selectedGuest.guestId).then(data => {
      if (!isCancelled) {
        setHistory(Array.isArray(data) ? data : []);
      }
    }).catch(err => {
      if (!isCancelled) {
        setHistory([]);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedGuest?.guestId, userId, fetchChatHistory]);

  // Memoize allMessages để tránh tính toán lại không cần thiết
  const allMessages = useMemo(() => {
    if (!selectedGuest) return [];

    const realtimeArray = Array.isArray(realtimeMessages) ? realtimeMessages : [];
    const historyArray = Array.isArray(history) ? history : [];

    const merged = [
      ...historyArray,
      ...realtimeArray.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === selectedGuest.guestId) ||
          (m.receiverId === userId && m.senderId === selectedGuest.guestId)
      ),
    ];

    // Loại bỏ duplicate với hiệu suất tốt hơn
    const seen = new Set();
    const unique = merged.filter(msg => {
      const key = msg.messageId || `${msg.senderId}-${msg.receiverId}-${msg.message}-${msg.timestamp}`;
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
    if (trimmedInput && selectedGuest && sendMessage) {
      sendMessage(selectedGuest.guestId, trimmedInput);
      setInput("");
    }
  }, [input, selectedGuest, sendMessage]);

  const formatTime = useCallback((ts?: string) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      return "";
    }
  }, []);

  const handleGuestSelect = useCallback((guest: GuestInfo) => {
    setSelectedGuest(guest);
  }, []);

  // Safe check cho guests array
  const safeGuests = Array.isArray(guests) ? guests : [];

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
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}
    >
      {/* Danh sách khách */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #e5e7eb",
          padding: 12,
          background: "#f9fafb",
          overflowY: "auto",
        }}
      >
        <div style={{ 
          fontWeight: 600, 
          marginBottom: 10, 
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🧑‍💻 Khách tư vấn
            <span style={{ 
              fontSize: 12, 
              background: "#2563eb", 
              color: "white", 
              borderRadius: 10, 
              padding: "2px 6px" 
            }}>
              {safeGuests.length}
            </span>
          </div>
          
          {/* Debug và Refresh button */}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={handleForceRefetch}
              disabled={isLoading}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: 10,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
              }}
              title="Force refresh"
            >
              {isLoading ? "⏳" : "🔄"}
            </button>
          </div>
        </div>
        
        {isLoading && (
          <div style={{ color: "#f59e0b", fontSize: 14, textAlign: "center", marginTop: 10 }}>
            Đang tải...
          </div>
        )}
        
        {!isLoading && safeGuests.length === 0 && (
          <div style={{ color: "#888", fontSize: 14, textAlign: "center", marginTop: 20 }}>
            Chưa có tin nhắn nào từ khách
            <br />
            <small style={{ color: "#666", fontSize: 12 }}>
              Guests: {JSON.stringify(guests)}<br/>
              FetchGuests: {fetchGuests ? "✓" : "✗"}
            </small>
          </div>
        )}
        
        {safeGuests.map((guest) => (
          <div
            key={guest.guestId}
            onClick={() => handleGuestSelect(guest)}
            style={{
              padding: "10px 12px",
              cursor: "pointer",
              borderRadius: 8,
              background: selectedGuest?.guestId === guest.guestId ? "#2563eb" : "#fff",
              color: selectedGuest?.guestId === guest.guestId ? "#fff" : "#111",
              marginBottom: 8,
              fontSize: 14,
              transition: "all 0.2s",
              wordBreak: "break-all",
              border: "1px solid #e5e7eb",
              boxShadow: selectedGuest?.guestId === guest.guestId 
                ? "0 2px 8px rgba(37, 99, 235, 0.2)" 
                : "0 1px 3px rgba(0,0,0,0.1)",
            }}
            title={guest.guestId}
          >
            <div style={{ fontWeight: 500 }}>
              {guest.name || `Guest ${guest.guestId.slice(0, 8)}`}
            </div>
            {guest.lastMessageAt && (
              <div style={{ 
                fontSize: 11, 
                color: selectedGuest?.guestId === guest.guestId ? "#cbd5e1" : "#6b7280",
                marginTop: 2
              }}>
                {formatTime(guest.lastMessageAt)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat box - phần này giữ nguyên */}
      <div style={{ flex: 1, padding: 16, position: "relative" }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 1001,
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
            }}
          >
            ×
          </button>
        )}

        {selectedGuest ? (
          <>
            <div style={{ 
              fontWeight: 600, 
              fontSize: 16, 
              marginBottom: 12, 
              color: "#2563eb",
              paddingRight: 40
            }}>
              💬 Chat với {selectedGuest.name || `Guest ${selectedGuest.guestId.slice(0, 8)}`}
            </div>

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
                gap: 8,
              }}
            >
              {allMessages.length === 0 && (
                <div style={{ 
                  color: "#6b7280", 
                  textAlign: "center", 
                  marginTop: 40,
                  fontStyle: "italic"
                }}>
                  Chưa có tin nhắn nào
                </div>
              )}

              {allMessages.map((msg, i) => (
                <div
                  key={msg.messageId || `${msg.senderId}-${msg.timestamp}-${i}`}
                  style={{
                    alignSelf: msg.senderId === userId ? "flex-end" : "flex-start",
                    background: msg.senderId === userId ? "#2563eb" : "#e0e7ff",
                    color: msg.senderId === userId ? "#fff" : "#1e293b",
                    borderRadius: 12,
                    padding: "10px 14px",
                    maxWidth: "75%",
                    boxShadow: msg.senderId === userId
                      ? "0 2px 8px rgba(37, 99, 235, 0.2)"
                      : "0 2px 8px rgba(100, 116, 139, 0.1)",
                    fontSize: 14,
                    wordBreak: "break-word",
                    position: "relative",
                  }}
                >
                  <div>{msg.message}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: msg.senderId === userId ? "#cbd5e1" : "#64748b",
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
                  outline: "none",
                  background: "#fff",
                  transition: "border-color 0.2s",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2563eb";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                }}
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
                  boxShadow: input.trim() 
                    ? "0 2px 8px rgba(37, 99, 235, 0.2)" 
                    : "none",
                  transition: "all 0.2s",
                }}
                disabled={!input.trim()}
              >
                Gửi
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            textAlign: "center", 
            color: "#6b7280", 
            marginTop: 100,
            fontStyle: "italic"
          }}>
            Chọn một khách để bắt đầu trò chuyện
          </div>
        )}
      </div>
    </div>
  );
}