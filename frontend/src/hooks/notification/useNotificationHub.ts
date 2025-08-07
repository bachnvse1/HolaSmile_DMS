import { useEffect } from "react";
import { createNotificationConnection } from "@/services/notificationHub";

export function useNotificationHub() {
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    console.log("token" + token)
    if (!token) return;

    const connection = createNotificationConnection(token);

    connection.on("ReceiveNotification", () => {
    });

    connection.start().catch((err) =>
      console.error("SignalR connection error:", err)
    );

    return () => {
      connection.stop();
    };
  }, []);
}
