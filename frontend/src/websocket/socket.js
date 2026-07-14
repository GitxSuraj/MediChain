import { API_BASE_URL } from "../services/api.js";

function getWebSocketUrl() {
  const apiUrl = new URL(API_BASE_URL);
  apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  apiUrl.pathname = "/ws";
  apiUrl.search = "";
  return apiUrl.toString();
}

export function createRealtimeSocket({ onOpen, onMessage, onClose, onError } = {}) {
  const socket = new WebSocket(getWebSocketUrl());

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
