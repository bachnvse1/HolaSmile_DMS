import { useEffect } from "react";
import { toast } from "react-toastify";
import { createNotificationConnection } from "@/services/notificationHub";

export function useNotificationHub() {
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    console.log("token" + token)
    if (!token) return;

    const connection = createNotificationConnection(token);

    connection.on("ReceiveNotification", (notification) => {
      console.log("📩 Notification received:", notification);
      toast.info(`${notification.title}: ${notification.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    });

    connection.start().catch((err) =>
      console.error("SignalR connection error:", err)
    );

    return () => {
      connection.stop();
    };
  }, []);
}
