import React, { useEffect, useState } from 'react';
import ChatBox from './ChatBox';
import axiosInstance from '@/lib/axios';

type Customer = {
  userId: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
};

type ChatMessage = {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
};

type Props = {
  selectedUser: Customer | null;
  customers: Customer[];
  onClose?: () => void;
  unreadMap: Record<string, number>;
  setUnreadMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSelectedUser: (user: Customer | null) => void;
  setHasNewMessage: React.Dispatch<React.SetStateAction<boolean>>;
  messages: ChatMessage[]; // 👈 truyền từ cha
  sendMessage: (receiverId: string, msg: string) => void; // 👈 truyền từ cha
};

export default function ChatPage({
  selectedUser,
  customers: initialCustomers,
  onClose,
  setSelectedUser,
  unreadMap,
  setUnreadMap,
  setHasNewMessage,
  messages,
  sendMessage
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);

  const handleSelectUser = (user: Customer) => {
    setSelectedUser(user);
    setUnreadMap((prev) => ({
      ...prev,
      [user.userId]: 0,
    }));
    setHasNewMessage(false);
  };

  useEffect(() => {
    if (initialCustomers.length === 0) {
      const fetchCustomers = async () => {
        try {
          const res = await axiosInstance.get('/user/allUsersChat');
          setCustomers(res.data || []);
        } catch (err) {
          console.error("Lỗi khi tải danh sách khách hàng", err);
          setCustomers([]);
        }
      };
      fetchCustomers();
    }
  }, [initialCustomers]);

  return (
    <div
      style={{
        display: 'flex',
        height: 500,
        width: 800,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: 'inherit',
        background: '#fff',
      }}
    >
      {/* Danh sách người dùng */}
      <div
        style={{
          width: 220,
          borderRight: '1px solid #e5e7eb',
          padding: 12,
          background: '#f9fafb',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 10, color: '#2563eb' }}>
          👥 Khách hàng
        </div>
        {customers.length === 0 && (
          <div style={{ color: '#888', fontSize: 14 }}>Không có người dùng nào</div>
        )}
        {customers.map((user) => (
          <div
            key={user.userId}
            onClick={() => handleSelectUser(user)}
            style={{
              padding: '8px 10px',
              cursor: 'pointer',
              borderRadius: 8,
              background: selectedUser?.userId === user.userId ? '#2563eb' : '#fff',
              color: selectedUser?.userId === user.userId ? '#fff' : '#111',
              marginBottom: 6,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <img
          src={
            user.avatarUrl
              ? user.avatarUrl
              : "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
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

            <span>{user.fullName}</span>
            {unreadMap?.[user.userId] > 0 && (
              <span
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'red',
                  fontSize: 18,
                }}
              >
                🔔
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chat box */}
      <div style={{ flex: 1, padding: 12, position: 'relative' }}>
        {selectedUser ? (
          <ChatBox
            receiver={{
              id: selectedUser.userId,
              name: selectedUser.fullName,
            }}
            messages={messages}
            sendMessage={sendMessage}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', marginTop: 80 }}>
            Chọn khách hàng để bắt đầu nhắn tin
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}