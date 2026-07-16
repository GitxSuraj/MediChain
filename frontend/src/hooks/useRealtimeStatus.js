import { useEffect, useState } from "react";

import { createRealtimeSocket } from "../websocket/socket.js";

export function useRealtimeStatus() {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const socket = createRealtimeSocket({
      onOpen: () => setStatus("connected"),
      onClose: () => setStatus("disconnected"),
      onError: () => setStatus("error"),
    });

    return () => socket.close();
  }, []);

  return status;
}
