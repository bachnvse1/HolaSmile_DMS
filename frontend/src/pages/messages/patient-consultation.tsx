import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from '@/components/chatbox/ChatHubProvider';
import type { ChatMessage } from '@/hooks/useChatHubGuest';

type Customer = {
  userId: string;
  fullName: string;
  phone: string;
  role: string;
  avatarUrl?: string;
};

// Memoize UserItem để tránh re-render không cần thiết
const UserItem = memo(({ 
  user, 
  isSelected, 
  unreadCount, 
  onClick 
}: {
  user: Customer;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      padding: '8px 10px',
      cursor: 'pointer',
      borderRadius: 8,
      background: isSelected ? '#2563eb' : '#fff',
      color: isSelected ? '#fff' : '#111',
      marginBottom: 6,
      fontSize: 15,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'all 0.2s',
      position: 'relative',
      border: '1px solid #e5e7eb',
      boxShadow: isSelected 
        ? '0 2px 8px rgba(37, 99, 235, 0.2)' 
        : '0 1px 3px rgba(0,0,0,0.1)',
    }}
  >
    <img
      src={
        user.avatarUrl ||
        "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
      }
      alt="avatar"
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #e5e7eb',
      }}
    />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500 }}>{user.fullName}</div>
      <div style={{ 
        fontSize: 11, 
        color: isSelected ? '#cbd5e1' : '#6b7280',
        marginTop: 2
      }}>
        {user.phone}
      </div>
    </div>
    {unreadCount > 0 && (
      <span
        style={{
          background: '#ef4444',
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 10,
          padding: '2px 6px',
          minWidth: 16,
          textAlign: 'center',
        }}
      >
        {unreadCount}
      </span>
    )}
  </div>
));

const PatientConsultationPage: React.FC = () => {
  const { userId, role } = useAuth();
  const { 
    messages: realtimeMessages, 
    sendMessage, 
    fetchChatHistory,
    users,
    fetchUsers
  } = useChatHub();

  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessage = useRef<string>('');

  // Danh sách user ID hoặc role được phép truy cập
  const ALLOWED_ROLES = ["Administrator", "Owner", "Receptionist", "Assistant", "Dentist"];

  // Chỉ fetch users một lần khi component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Chỉ fetch history khi selectedUser thay đổi
  useEffect(() => {
    if (!userId || !selectedUser?.userId) {
      setHistory([]);
      return;
    }

    let isCancelled = false;
    
    fetchChatHistory(userId, selectedUser.userId).then(data => {
      if (!isCancelled) {
        setHistory(data);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedUser?.userId, userId, fetchChatHistory]);

  // Gộp history + realtime với memoization
  const allMessages = useMemo(() => {
    if (!selectedUser) return [];
    
    const merged = [
      ...history,
      ...realtimeMessages.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === selectedUser.userId) ||
          (m.receiverId === userId && m.senderId === selectedUser.userId)
      ),
    ];

    // Loại bỏ duplicate
    const unique = merged.filter((msg, idx, arr) =>
      arr.findIndex((m) =>
        m.senderId === msg.senderId &&
        m.receiverId === msg.receiverId &&
        m.message === msg.message &&
        Math.abs(new Date(m.timestamp || '').getTime() - new Date(msg.timestamp || '').getTime()) < 1000
      ) === idx
    );

    return unique.sort((a, b) =>
      new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
    );
  }, [history, realtimeMessages, selectedUser, userId]);

  // Xử lý tin nhắn mới với debounce
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;

    const lastMsg = realtimeMessages[realtimeMessages.length - 1];
    const messageKey = `${lastMsg.senderId}-${lastMsg.message}-${lastMsg.timestamp}`;
    
    // Tránh xử lý cùng một tin nhắn nhiều lần
    if (lastProcessedMessage.current === messageKey) return;
    lastProcessedMessage.current = messageKey;

    if (lastMsg.receiverId === userId) {
      const sender = users.find((u) => u.userId === lastMsg.senderId);
      if (!sender) return;

      const isNotCurrentChat = !selectedUser || selectedUser.userId !== sender.userId;
      if (isNotCurrentChat) {
        setUnreadMap((prev) => ({
          ...prev,
          [sender.userId]: (prev[sender.userId] || 0) + 1,
        }));

        setHasNewMessage(true);
      }
    }
  }, [realtimeMessages, users, userId, selectedUser]);

  // Auto scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timer);
  }, [allMessages.length]);

  // Reset unread khi mở chat
  const handleUserSelect = useCallback((user: Customer) => {
    setSelectedUser(user);
    setUnreadMap((prev) => ({
      ...prev,
      [user.userId]: 0,
    }));
    setHasNewMessage(false);
  }, []);

  const handleSend = useCallback(() => {
    const trimmedInput = input.trim();
    if (trimmedInput && selectedUser && sendMessage) {
      sendMessage(selectedUser.userId, trimmedInput);
      setInput("");
    }
  }, [input, selectedUser, sendMessage]);

  const formatTime = useCallback((ts?: string) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      return "";
    }
  }, []);

  // Kiểm tra quyền truy cập AFTER all hooks
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
            <div className="mb-4">
              <svg className="h-16 w-16 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Không Có Quyền Truy Cập
            </h1>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang tư vấn bệnh nhân này. 
              Chỉ những người dùng được ủy quyền mới có thể sử dụng tính năng này.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">Vai trò:</span> {role || 'Không xác định'}
              </p>
            </div>
            <button 
              onClick={() => window.history.back()} 
              className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Quay Lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tư Vấn Bệnh Nhân
          </h1>
          <p className="text-gray-600">
            Quản lý và trả lời các tin nhắn tư vấn từ bệnh nhân
          </p>
          <div className="mt-2 text-sm text-green-600">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100">
              ✓ Được ủy quyền - {role || 'Không xác định'}
            </span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Hộp thoại tư vấn bệnh nhân
            </h2>
            <p className="text-sm text-gray-600">
              Chọn bệnh nhân từ danh sách bên trái để bắt đầu trò chuyện
            </p>
          </div>

          {/* Chat Box */}
          <div className="relative">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div style={{ 
                position: 'relative',
                height: '600px',
                width: '100%'
              }}>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    height: "100%",
                    width: "100%",
                    border: "none",
                    borderRadius: 0,
                    overflow: "hidden",
                    fontFamily: "inherit",
                    background: "#fff",
                    boxShadow: "none",
                  }}
                >
                  {/* Danh sách bệnh nhân */}
                  <div
                    style={{
                      width: 280,
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
                    }}>
                      👥 Bệnh nhân
                      <span style={{ 
                        fontSize: 12, 
                        background: "#2563eb", 
                        color: "white", 
                        borderRadius: 10, 
                        padding: "2px 6px" 
                      }}>
                        {users.length}
                      </span>
                    </div>
                    
                    {users.length === 0 && (
                      <div style={{ color: "#888", fontSize: 14, textAlign: "center", marginTop: 20 }}>
                        Chưa có bệnh nhân nào
                      </div>
                    )}
                    
                    {users.map((user) => (
                      <UserItem
                        key={user.userId}
                        user={user}
                        isSelected={selectedUser?.userId === user.userId}
                        unreadCount={unreadMap[user.userId] || 0}
                        onClick={() => handleUserSelect(user)}
                      />
                    ))}
                  </div>

                  {/* Chat area */}
                  <div style={{ flex: 1, padding: 16, position: "relative" }}>
                    {selectedUser ? (
                      <>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: 16, 
                          marginBottom: 12, 
                          color: "#2563eb",
                        }}>
                          💬 Chat với {selectedUser.fullName}
                        </div>

                        <div
                          style={{
                            height: 440,
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
                              key={`${msg.senderId}-${msg.timestamp}-${i}`}
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
                            placeholder="Nhập tin nhắn cho bệnh nhân..."
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
                        marginTop: 200,
                        fontStyle: "italic"
                      }}>
                        Chọn một bệnh nhân để bắt đầu trò chuyện
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info/Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Hướng dẫn sử dụng
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Bệnh nhân sẽ xuất hiện trong danh sách bên trái khi họ gửi tin nhắn</li>
                  <li>Nhấp vào tên bệnh nhân để xem lịch sử chat và trả lời</li>
                  <li>Tin nhắn sẽ được cập nhật theo thời gian thực</li>
                  <li>Sử dụng phím Enter để gửi tin nhắn nhanh</li>
                  <li>Có thể gửi hình ảnh, tài liệu tư vấn cho bệnh nhân</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientConsultationPage;