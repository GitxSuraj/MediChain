from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from realtime.connection_manager import manager


router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, identity: str | None = None):
    """Realtime WebSocket endpoint.

    `identity` is an optional query param (`/ws?identity=<patient_id or
    hospital_id>`) used for targeted delivery via `send_to`. Connections made
    without an identity keep receiving broadcasts exactly as before — this
    was a required constraint from the roadmap (existing bed/transfer clients
    must not break).
    """
    await manager.connect(websocket, identity)
    await manager.send_json(
        websocket,
        {
            "event": "connection_established",
            "message": "Connected to Hospital Network realtime updates.",
            "identity": identity,
        },
    )

    try:
        while True:
            message = await websocket.receive_json()

            if message.get("event") == "ping":
                await manager.send_json(websocket, {"event": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, identity)
