import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import ChatPage from './ChatPage';
import { useAuth } from '@/hooks/useAuth';
import { useChatHub } from './ChatHubProvider';
import type { ChatMessage } from '@/hooks/useChatHubGuest';

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const { userId } = useAuth();
  const { 
    messages: realtimeMessages, 
    sendMessage, 
    fetchChatHistory,
    users,
    fetchUsers
  } = useChatHub();

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const lastProcessedMessage = useRef<string>('');
  
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

      const isNotCurrentChat = !open || !selectedUser || selectedUser.userId !== sender.userId;
      if (isNotCurrentChat) {
        setUnreadMap((prev) => ({
          ...prev,
          [sender.userId]: (prev[sender.userId] || 0) + 1,
        }));

        setHasNewMessage(true);
        audioRef.current?.play().catch(() => {});
      }
    }
  }, [realtimeMessages, users, userId, open, selectedUser]);

  // Reset unread khi mở chat
  const handleUserSelect = useCallback((user: any) => {
    setSelectedUser(user);
    setUnreadMap((prev) => ({
      ...prev,
      [user.userId]: 0,
    }));
    setHasNewMessage(false);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const newOpen = !prev;
      if (newOpen && users.length > 0 && !selectedUser) {
        setSelectedUser(users[0]);
      }
      return newOpen;
    });
  }, [users, selectedUser]);

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
            customers={users}
            onClose={() => setOpen(false)}
            unreadMap={unreadMap}
            setUnreadMap={setUnreadMap}
            setSelectedUser={handleUserSelect}
            setHasNewMessage={setHasNewMessage}
            messages={allMessages}
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
