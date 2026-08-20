import { API_BASE_URL } from "../services/api.js";

function getWebSocketUrl(identity) {
  const apiUrl = new URL(API_BASE_URL);
  apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  apiUrl.pathname = "/ws";
  apiUrl.search = identity ? `?identity=${encodeURIComponent(identity)}` : "";
  return apiUrl.toString();
}

export function createRealtimeSocket({ identity, onOpen, onMessage, onClose, onError } = {}) {
  const socket = new WebSocket(getWebSocketUrl(identity));

  socket.addEventListener("open", () => {
    onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    onMessage?.(message);
  });

  socket.addEventListener("close", () => {
    onClose?.();
  });

  socket.addEventListener("error", (event) => {
    onError?.(event);
  });

  return socket;
}
