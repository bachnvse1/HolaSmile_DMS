import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createNotificationConnection } from "@/services/notificationHub";
import { toast } from "react-toastify";
import axios from "axios";

type NotificationDto = {
  notificationId: number;
  title: string;
  message: string;
  targetUrl?: string;
  createdAt: string;
};

export function NotificationButton() {
  const [showList, setShowList] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [hasUnread, setHasUnread] = useState(false); // 🔴 Có thông báo mới
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // 🔔 Âm thanh

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const connection = createNotificationConnection(token);

    // Gọi API lấy danh sách thông báo
    axios
      .get<NotificationDto[]>(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        } else {
          setNotifications([]);
        }
      })
      .catch(console.error);

    // Lắng nghe sự kiện từ SignalR
    connection.on("ReceiveNotification", (notification: NotificationDto) => {
      toast.info(`${notification.title}`);
      setNotifications((prev) => [notification, ...prev]);
      setHasUnread(true); // 🔴 có thông báo mới

      // 🔔 Phát âm thanh nếu được phép
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn("Không thể phát âm thanh:", err);
        });
      }
    });

    connection.start().catch(console.error);
    return () => {
      connection.stop();
    };
  }, []);

  const handleClick = () => {
    setShowList((prev) => !prev);
    setHasUnread(false); // ❌ ẩn chấm đỏ khi người dùng đã xem
  };

  return (
    <div className="relative inline-block text-left">
      {/* 🔔 Âm thanh báo */}
      <audio ref={audioRef} src="/sound/inflicted-601.ogg" preload="auto" />

      <button
        ref={buttonRef}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full relative"
        title="Thông báo"
        onClick={handleClick}
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {showList && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Không có thông báo.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}