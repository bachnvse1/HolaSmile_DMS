import { useEffect, useState } from 'react';
import ChatPage from './ChatPage';
import { useChatHub } from '@/hooks/useChatHub';
import { useAuth } from '@/hooks/useAuth';
import axiosInstance from '@/lib/axios';

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const { token, userId } = useAuth();
  const { messages } = useChatHub(token ?? '', selectedUser?.userId ?? '');

  // Fetch danh sách người dùng
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axiosInstance.get('/user/allUsersChat');
        setCustomers(res.data || []);
      } catch {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Tự động mở khi có tin nhắn đến
  useEffect(() => {
    if (!userId || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // Nếu người khác nhắn đến
    if (lastMsg.receiverId === userId) {
      const sender = customers.find((u) => u.userId === lastMsg.senderId);

      if (!sender) return;

      // Nếu chưa mở chat với người đó thì tăng unread
      if (!selectedUser || selectedUser.userId !== sender.userId) {
        setUnreadMap((prev) => ({
          ...prev,
          [sender.userId]: (prev[sender.userId] || 0) + 1,
        }));
      }

      // Nếu chưa mở cửa sổ chat thì auto mở
      if (!open || selectedUser?.userId !== sender.userId) {
        setSelectedUser(sender);
        setOpen(true);
      }
    }
  }, [messages, customers, userId, open, selectedUser]);

  const handleToggle = () => {
    if (!open) {
      if (!selectedUser && customers.length > 0) {
        setSelectedUser(customers[0]);
      }
    }
    setOpen(!open);
  };

  return (
    <>
      {/* Chat Popup */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 30,
            width: 800,
            height: 500,
            zIndex: 999,
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            borderRadius: 12,
            background: '#fff',
          }}
        >
          <ChatPage
            selectedUser={selectedUser}
            customers={customers}
            onClose={() => setOpen(false)}
            unreadMap={unreadMap}
            setUnreadMap={setUnreadMap}
            setSelectedUser={setSelectedUser}
          />
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#2563eb',
          color: 'white',
          borderRadius: '50%',
          width: 60,
          height: 60,
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
        title="Mở chat"
      >
        💬
      </button>
    </>
  );
}
