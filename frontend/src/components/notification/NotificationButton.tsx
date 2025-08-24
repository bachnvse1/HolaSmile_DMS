import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createNotificationConnection } from "@/services/notificationHub";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TokenUtils } from "@/utils/tokenUtils";
import { Button } from "../ui/button";

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
  if (lower.includes("invoice") || lower.includes("hoá đơn") || lower.includes("thanh toán"))
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

    const handleMarkAllAsRead = async (): Promise<void> => {
    const token = localStorage.getItem("token") || "";
    const userId = TokenUtils.getUserIdFromToken(token);
    if (!token || !userId) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/mark-all-as-read/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true"
          },
        }
      );
      setNotifications((prev: NotificationDto[]) => prev.map((n: NotificationDto) => ({ ...n, isRead: true })));
      setHasUnread(false);
    } catch {
      toast.error("Không thể đánh dấu tất cả đã đọc");
    }
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
            <div className="absolute top-0 right-0 -mt-1 -mr-1 z-20">
              <span className="absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {
                  notifications.filter(n => !n.isRead).length > 9 
                    ? "9+" 
                    : notifications.filter(n => !n.isRead).length
                }
              </span>
            </div>
          )}
      </button>

      {showList && (
        <div className="fixed sm:absolute 
                       top-14 sm:top-auto sm:mt-2
                       left-4 right-4 sm:left-auto sm:right-0
                       w-auto sm:w-80 
                       sm:max-w-sm
                       md:w-96 md:max-w-md
                       lg:w-[420px] lg:max-w-lg
                       bg-white dark:bg-gray-900 
                       border border-gray-200 dark:border-gray-700 
                       rounded-xl shadow-xl z-50 overflow-hidden">
          
          <div className="block sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Thông báo</h3>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowList(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                           p-1 bg-white dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600
                           border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="max-h-[70vh] sm:max-h-[400px] md:max-h-[500px] lg:max-h-[600px] 
                         overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 sm:p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                Không có thông báo.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 sm:p-4 
                             border-b border-gray-100 dark:border-gray-800 
                             hover:bg-gray-50 dark:hover:bg-gray-800 
                             cursor-pointer transition-all duration-200
                             active:bg-gray-100 dark:active:bg-gray-700
                             min-h-[80px]
                             ${
                    !n.isRead
                      ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500'
                      : 'opacity-60'
                  }`}
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-100 
                                 text-base sm:text-base 
                                 line-clamp-2 mb-2">
                    {n.title}
                  </div>
                  <div className="text-sm sm:text-sm 
                                 text-gray-600 dark:text-gray-300 
                                 line-clamp-3 sm:line-clamp-3 
                                 leading-relaxed mb-3">
                    {n.message}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(n.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}

                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Dropdown */}
          <div
            className="absolute sm:right-0 sm:left-auto left-0 right-0 mt-2 sm:w-96 sm:max-w-sm w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden hidden sm:block"
            style={{ minWidth: '0' }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Thông báo</span>
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-300"
                disabled={notifications.every(n => n.isRead)}
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Không có thông báo.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.notificationId}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all ${
                      !n.isRead
                        ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500'
                        : 'opacity-60'
                    }`}
                  >
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{n.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{n.message}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}