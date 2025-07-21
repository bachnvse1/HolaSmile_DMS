
import { HubConnectionBuilder } from "@microsoft/signalr";

export function createChatConnection(token: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const chatUrl = baseUrl.replace(/\/api\/?$/, "") + "/chat";
  return new HubConnectionBuilder()
    .withUrl(chatUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
}
