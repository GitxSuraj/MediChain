from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from realtime.connection_manager import manager


router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await manager.send_json(
        websocket,
        {
            "event": "connection_established",
            "message": "Connected to Hospital Network realtime updates.",
        },
    )

    try:
        while True:
            message = await websocket.receive_json()

            if message.get("event") == "ping":
                await manager.send_json(websocket, {"event": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
