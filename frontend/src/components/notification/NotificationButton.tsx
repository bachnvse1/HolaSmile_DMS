import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createNotificationConnection } from "@/services/notificationHub";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type NotificationDto = {
  notificationId: number;
  title: string;
  type: string;
  message: string;
  targetUrl?: string;
  mappingUrl?: string;
  relatedObjectId?: number;
  createdAt: string;
};

// ✅ Mapping type → route based on backend notification types
const typeToRouteMapping: { [key: string]: string } = {
  // Financial transactions
  "transaction": "/financial-transactions",
  
  // Appointments
  "appointment": "/appointments",
  
  // Patients
  "patient": "/patients",
  
  // Promotions
  "promotion": "/promotions",
  "promotions": "/promotions",
  
  // Invoices
  "invoice": "/invoices",
  
  // Schedules
  "schedule": "/schedules",
  
  // Procedures
  "procedure": "/procedures",
  
  // Tasks
  "task_assigned": "/assistant/assigned-tasks",
  
  // Warranty cards
  "warranty-card": "/assistant/warranty-cards",
  
  // Treatment records and progress
  "Tiến trình điều trị": "/patient/treatment-records",
  "Xem hồ sơ": "/patient/treatment-records",
  "Xoá hồ sơ": "/patient/treatment-records",
  "Xem chi tiết": "/patient/orthodontic-treatment-plans",
  
  // Prescriptions
  "Chỉ dẫn điều trị": "/prescription-templates",
  
  // Work registration
  "Đăng ký lịch làm việc": "/schedules",
  
  // Default fallback
  "Info": "/",
  "Error": "/",
  "Reminder": "/",
  "Alert": "/"
};

function mapTypeToRoute(type: string): string {
  // Direct mapping first
  if (typeToRouteMapping[type]) {
    return typeToRouteMapping[type];
  }
  
  // Fallback to keyword matching for compatibility
  const lower = type.toLowerCase().trim();
  
  // Check for keywords in type
  if (lower.includes("transaction") || lower.includes("thu") || lower.includes("chi")) {
    return "/financial-transactions";
  }
  if (lower.includes("appointment") || lower.includes("lịch hẹn") || lower.includes("hẹn")) {
    return "/appointments";
  }
  if (lower.includes("patient") || lower.includes("bệnh nhân")) {
    return "/patients";
  }
  if (lower.includes("promotion") || lower.includes("khuyến mãi")) {
    return "/promotions";
  }
  if (lower.includes("invoice") || lower.includes("hóa đơn") || lower.includes("thanh toán")) {
    return "/invoices";
  }
  if (lower.includes("schedule") || lower.includes("lịch làm việc")) {
    return "/schedules";
  }
  if (lower.includes("điều trị") || lower.includes("treatment")) {
    return "/patient/treatment-records";
  }
  if (lower.includes("đơn thuốc") || lower.includes("prescription")) {
    return "/prescription-templates";
  }
  if (lower.includes("nhiệm vụ") || lower.includes("task")) {
    return "/assistant/assigned-tasks";
  }
  if (lower.includes("bảo hành") || lower.includes("warranty")) {
    return "/assistant/warranty-cards";
  }
  
  // Default fallback
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

    const connection = createNotificationConnection(token);
    connection.start().catch(console.error);

    axios
      .get<NotificationDto[]>(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setNotifications(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error);

    connection.on("ReceiveNotification", (notification: NotificationDto) => {
      toast.info(notification.title);
      setNotifications((prev) => [notification, ...prev]);
      setHasUnread(true);
      audioRef.current?.play().catch((err) => {
        console.warn("Không thể phát âm thanh:", err);
      });
    });

    return () => {
      connection.stop();
    };
  }, []);

  const handleClick = () => {
    setShowList((prev) => !prev);
    setHasUnread(false);
  };

  const handleNotificationClick = (notification: NotificationDto) => {
    let route: string;
    
    // Priority 1: Use MappingUrl from backend if available (already contains full path)
    if (notification.mappingUrl && notification.mappingUrl.trim() !== "") {
      route = notification.mappingUrl.startsWith('/') ? notification.mappingUrl : `/${notification.mappingUrl}`;
    } 
    // Priority 2: Extract route and ID from MappingUrl pattern like "financial-transactions/123"
    else if (notification.type && notification.mappingUrl && notification.mappingUrl.includes('/')) {
      route = `/${notification.mappingUrl}`;
    }
    // Priority 3: Build route from type + relatedObjectId
    else if (notification.relatedObjectId && notification.relatedObjectId > 0) {
      const baseRoute = mapTypeToRoute(notification.type);
      route = `${baseRoute}/${notification.relatedObjectId}`;
    }
    // Priority 4: Fallback to type mapping
    else {
      route = mapTypeToRoute(notification.type);
    }
    
    navigate(route);
    setShowList(false);
  };

  return (
    <div className="relative inline-block text-left">
      <audio ref={audioRef} src="/sound/inflicted-601.ogg" preload="auto" />
      <button
        onClick={handleClick}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full relative"
        title="Thông báo"
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
                  onClick={() => handleNotificationClick(n)}
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