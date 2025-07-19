import { useEffect, useState, useRef, useMemo } from 'react';
import ChatPage from './ChatPage';
import { useAuth } from '@/hooks/useAuth';
import axiosInstance from '@/lib/axios';
import { useChatHub } from '@/hooks/useChatHub';
import type { ChatMessage } from '@/hooks/useChatHub';

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]); // ✅ Chat history

  const { token, userId } = useAuth();
  const { realtimeMessages, sendMessage, fetchChatHistory } = useChatHub(token!);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 📥 Fetch danh sách người dùng
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

  // 📥 Fetch lịch sử khi chọn người chat
  useEffect(() => {
    if (!userId || !selectedUser?.userId) return;
    fetchChatHistory(userId, selectedUser.userId).then(setHistory);
  }, [selectedUser, userId, fetchChatHistory]);

  // 🧠 Gộp history + realtime
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
    return merged.sort((a, b) =>
      new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
    );
  }, [history, realtimeMessages, selectedUser, userId]);

  // 🔔 Xử lý tin nhắn mới đến
  useEffect(() => {
    if (!userId || realtimeMessages.length === 0) return;

    const lastMsg = realtimeMessages[realtimeMessages.length - 1];

    if (lastMsg.receiverId === userId) {
      const sender = customers.find((u) => u.userId === lastMsg.senderId);
      if (!sender) return;

      const isNotCurrentChat = !open || !selectedUser || selectedUser.userId !== sender.userId;
      if (isNotCurrentChat) {
        setUnreadMap((prev) => ({
          ...prev,
          [sender.userId]: (prev[sender.userId] || 0) + 1,
        }));

        setHasNewMessage(true);
        audioRef.current?.play().catch((err) => {
          console.warn('Không thể phát âm thanh:', err);
        });
      }
    }
  }, [realtimeMessages, customers, userId, open, selectedUser]);

  // ✅ Reset chấm đỏ khi mở đúng người
  useEffect(() => {
    if (!open || !selectedUser) return;

    const unreadCount = unreadMap[selectedUser.userId] || 0;
    if (unreadCount > 0) {
      setUnreadMap((prev) => ({
        ...prev,
        [selectedUser.userId]: 0,
      }));
    }

    setHasNewMessage(false);
  }, [open, selectedUser, unreadMap]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open && customers.length > 0 && !selectedUser) {
      setSelectedUser(customers[0]);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/sound/inflicted-601.ogg" preload="auto" />

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
            setHasNewMessage={setHasNewMessage}
            messages={allMessages} // ✅ full messages để hiển thị
            sendMessage={sendMessage}
          />
        </div>
      )}

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
