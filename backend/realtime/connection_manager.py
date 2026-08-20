from fastapi import WebSocket

# Bucket used for connections that did not authenticate with an identity
# (keeps old broadcast-only clients working unmodified).
ANONYMOUS_IDENTITY = "__anonymous__"


class ConnectionManager:
    """Identity-aware connection manager.

    Person C (targeted WebSocket notifications) requirement: connections are
    tracked per-identity (patient_id or hospital_id) so a message can be sent
    to exactly one recipient with `send_to`, while `broadcast` keeps working
    for every existing event (bed updates, transfer updates, etc).
    """

    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, identity: str | None = None) -> None:
        await websocket.accept()
        key = identity or ANONYMOUS_IDENTITY
        self.active_connections.setdefault(key, []).append(websocket)

    def disconnect(self, websocket: WebSocket, identity: str | None = None) -> None:
        if identity is not None:
            connections = self.active_connections.get(identity, [])
            if websocket in connections:
                connections.remove(websocket)
            if not connections and identity in self.active_connections:
                del self.active_connections[identity]
            return

        # Fallback: identity unknown (e.g. legacy caller) — search every bucket.
        for key, connections in list(self.active_connections.items()):
            if websocket in connections:
                connections.remove(websocket)
                if not connections:
                    del self.active_connections[key]

    async def send_json(self, websocket: WebSocket, message: dict) -> None:
        await websocket.send_json(message)

    async def send_to(self, identity: str, message: dict) -> int:
        """Send `message` to every connection registered under `identity`.

        Returns the number of connections the message was delivered to (0 if
        the identity is not currently connected — callers should treat that
        as "deliver on next reconnect" rather than an error).
        """
        connections = self.active_connections.get(identity, [])
        disconnected: list[WebSocket] = []
        delivered = 0

        for connection in connections:
            try:
                await connection.send_json(message)
                delivered += 1
            except RuntimeError:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection, identity)

        return delivered

    async def broadcast(self, message: dict) -> None:
        for identity, connections in list(self.active_connections.items()):
            disconnected: list[WebSocket] = []
            for connection in connections:
                try:
                    await connection.send_json(message)
                except RuntimeError:
                    disconnected.append(connection)
            for connection in disconnected:
                self.disconnect(connection, identity)


manager = ConnectionManager()
