import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createNotificationConnection } from "@/services/notificationHub";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TokenUtils } from "@/utils/tokenUtils";

type NotificationDto = {
  notificationId: number;
  title: string;
  type: string;
  message: string;
  targetUrl?: string;
  mappingUrl?: string;
  relatedObjectId?: number;
  createdAt: string;
  isRead: boolean;
};

const typeToRouteMapping: { [key: string]: string } = {
  "transaction": "/financial-transactions",
  "appointment": "/appointments",
  "patient": "/patients",
  "promotion": "/promotions",
  "promotions": "/promotions",
  "invoice": "/invoices",
  "schedule": "/schedules",
  "procedure": "/procedures",
  "task_assigned": "/assistant/assigned-tasks",
  "warranty-card": "/assistant/warranty-cards",
  "Tiến trình điều trị": "/patient/treatment-records",
  "Xem hồ sơ": "/patient/treatment-records",
  "Xoá hồ sơ": "/patient/treatment-records",
  "Xem chi tiết": "/patient/orthodontic-treatment-plans",
  "Chỉ dẫn điều trị": "/prescription-templates",
  "Đăng ký lịch làm việc": "/schedules",
  "Info": "/",
  "Error": "/",
  "Reminder": "/",
  "Alert": "/"
};

function mapTypeToRoute(type: string): string {
  if (typeToRouteMapping[type]) return typeToRouteMapping[type];
  const lower = type.toLowerCase().trim();

  if (lower.includes("transaction") || lower.includes("thu") || lower.includes("chi"))
    return "/financial-transactions";
  if (lower.includes("appointment") || lower.includes("lịch hẹn") || lower.includes("hẹn"))
    return "/appointments";
  if (lower.includes("patient") || lower.includes("bệnh nhân"))
    return "/patients";
  if (lower.includes("promotion") || lower.includes("khuyến mãi"))
    return "/promotions";
  if (lower.includes("invoice") || lower.includes("hóa đơn") || lower.includes("thanh toán"))
    return "/invoices";
  if (lower.includes("schedule") || lower.includes("lịch làm việc"))
    return "/schedules";
  if (lower.includes("điều trị") || lower.includes("treatment"))
    return "/patient/treatment-records";
  if (lower.includes("đơn thuốc") || lower.includes("prescription"))
    return "/prescription-templates";
  if (lower.includes("nhiệm vụ") || lower.includes("task"))
    return "/assistant/assigned-tasks";
  if (lower.includes("bảo hành") || lower.includes("warranty"))
    return "/assistant/warranty-cards";

  return "/";
}

export function NotificationButton() {
  const [showList, setShowList] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const userId = TokenUtils.getUserIdFromToken(token);
    if (!token || !userId) return;

    const connection = createNotificationConnection(token);
    connection.start().catch(console.error);

    axios.get<NotificationDto[]>(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true"
      },
    }).then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);

      axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications/unread-count/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
      }).then((res) => {
        if (res.data?.unreadCount > 0) setHasUnread(true);
      });
    }).catch(console.error);

    connection.on("ReceiveNotification", (notification: NotificationDto) => {
      toast.info(notification.title);
      setNotifications((prev) => [notification, ...prev]);
      setHasUnread(true);
      audioRef.current?.play().catch(err => console.warn("Không thể phát âm thanh:", err));
    });

    return () => {
      connection.stop();
    };
  }, []);

  const handleClick = () => {
    setShowList((prev) => !prev);
    setHasUnread(false);
  };

  const handleNotificationClick = async (notification: NotificationDto) => {
    const token = localStorage.getItem("token") || "";
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/mark-as-read/${notification.notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true"
          },
        }
      );
    } catch (err) {
      console.warn("Không thể đánh dấu đã đọc:", err);
    }

    let route: string;
    if (notification.mappingUrl && notification.mappingUrl.trim() !== "") {
      route = notification.mappingUrl.startsWith('/')
        ? notification.mappingUrl
        : `/${notification.mappingUrl}`;
    } else if (notification.type && notification.mappingUrl?.includes('/')) {
      route = `/${notification.mappingUrl}`;
    } else if (notification.relatedObjectId && notification.relatedObjectId > 0) {
      const baseRoute = mapTypeToRoute(notification.type);
      route = `${baseRoute}/${notification.relatedObjectId}`;
    } else {
      route = mapTypeToRoute(notification.type);
    }

    setShowList(false);
    navigate(route);

    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
      )
    );

    const unreadLeft = notifications.filter((n) => !n.isRead && n.notificationId !== notification.notificationId);
    setHasUnread(unreadLeft.length > 0);
  };

  return (
    <div className="relative inline-block text-left">
      <audio ref={audioRef} src="/sound/inflicted-601.ogg" preload="auto" />
      <button
        onClick={handleClick}
        className="p-2 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative"
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </button>

      {showList && (
        <div className="absolute right-0 mt-2 w-96 max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Không có thông báo.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all ${
                    !n.isRead ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{n.message}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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