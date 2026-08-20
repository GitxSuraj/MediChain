from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # Targeted connections: identity (patient_id or hospital_id) → list of sockets
        self.targeted: dict[str, list[WebSocket]] = {}
        # Legacy broadcast list — all connections regardless of identity
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket, identity: str | None = None) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        if identity:
            self.targeted.setdefault(identity, []).append(websocket)

    def disconnect(self, websocket: WebSocket, identity: str | None = None) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if identity and identity in self.targeted:
            try:
                self.targeted[identity].remove(websocket)
            except ValueError:
                pass
            if not self.targeted[identity]:
                del self.targeted[identity]

    async def send_to(self, identity: str, message: dict) -> None:
        """Send a message only to connections registered under this identity."""
        dead: list[WebSocket] = []
        for ws in self.targeted.get(identity, []):
            try:
                await ws.send_json(message)
            except RuntimeError:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, identity)

    async def send_json(self, websocket: WebSocket, message: dict) -> None:
        await websocket.send_json(message)

    async def broadcast(self, message: dict) -> None:
        """Broadcast to every connected client — existing bed/transfer behavior unchanged."""
        dead: list[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except RuntimeError:
                dead.append(connection)
        for connection in dead:
            self.disconnect(connection)


manager = ConnectionManager()
