import { useEffect, useState, useRef } from 'react';
import ChatPage from './ChatPage';
import { useChatHub } from './ChatHubProvider';
import { useAuth } from '@/hooks/useAuth';
import axiosInstance from '@/lib/axios';

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [hasNewMessage, setHasNewMessage] = useState(false); // 🔴 chấm đỏ

  const { token, userId } = useAuth();
  const { messages } = useChatHub();

  const audioRef = useRef<HTMLAudioElement | null>(null); // 🔔 Âm thanh

  // Fetch người dùng
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

  // Khi có tin nhắn mới
  useEffect(() => {
    if (!userId || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    if (lastMsg.receiverId === userId) {
      const sender = customers.find((u) => u.userId === lastMsg.senderId);
      if (!sender) return;

      const isNotCurrentChat = !selectedUser || selectedUser.userId !== sender.userId || !open;

      if (isNotCurrentChat) {
        setUnreadMap((prev) => ({
          ...prev,
          [sender.userId]: (prev[sender.userId] || 0) + 1,
        }));

        setHasNewMessage(true); // 🔴 hiện chấm đỏ
        audioRef.current?.play().catch((err) => {
          console.warn('Không thể phát âm thanh:', err);
        });
      }
    }
  }, [messages, customers, userId, open, selectedUser]);

  // Khi click mở/tắt chat
  const handleToggle = () => {
    setOpen((prev) => !prev);

    if (!open && customers.length > 0 && !selectedUser) {
      setSelectedUser(customers[0]);
    }
  }

  useEffect(() => {
    if (!open || !selectedUser) return;

    const unreadCount = unreadMap[selectedUser.userId] || 0;
    if (unreadCount > 0) {
      setUnreadMap((prev) => ({
        ...prev,
        [selectedUser.userId]: 0,
      }));
    }

    setHasNewMessage(false); // Luôn tắt chấm đỏ khi mở popup
  }, [open, selectedUser, unreadMap]);


  return (
    <>
      {/* 🔊 Âm thanh */}
      <audio ref={audioRef} src="/sound/inflicted-601.ogg" preload="auto" />

      {/* Popup chat */}
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

      {/* Nút chat */}
      <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
        <button
          onClick={handleToggle}
          style={{
            background: '#2563eb',
            color: 'white',
            borderRadius: '50%',
            width: 60,
            height: 60,
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
          title="Mở chat"
        >
          💬

          {/* 🔴 chấm đỏ khi có tin mới */}
          {hasNewMessage && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'red',
              }}
            />
          )}
        </button>
      </div>
    </>
  );
}
