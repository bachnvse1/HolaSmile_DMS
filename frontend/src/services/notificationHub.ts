import { HubConnectionBuilder } from "@microsoft/signalr";

export function createNotificationConnection(token: string) {
  return new HubConnectionBuilder()
    .withUrl("https://localhost:5001/notify", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
}
