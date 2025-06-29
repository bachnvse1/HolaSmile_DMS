import { HubConnectionBuilder } from "@microsoft/signalr";

export function createNotificationConnection(token: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL; // Lấy từ biến môi trường
  const notifyUrl = baseUrl.replace(/\/api\/?$/, "") + "/notify"; // Loại bỏ /api nếu có

  return new HubConnectionBuilder()
    .withUrl(notifyUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
}
