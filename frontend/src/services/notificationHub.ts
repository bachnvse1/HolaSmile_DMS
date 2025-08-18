import { HubConnectionBuilder } from "@microsoft/signalr";

export function createNotificationConnection(token: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL; 
  const notifyUrl = baseUrl.replace(/\/api\/?$/, "") + "/notify"; 

  return new HubConnectionBuilder()
    .withUrl(notifyUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
}
