from typing import List

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status,
)

from app.core.security import decode_access_token


router = APIRouter(prefix="/ws", tags=["WebSockets"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Broadcast a JSON message to all connected clients."""
        disconnected_clients = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected_clients.append(connection)

        for connection in disconnected_clients:
            self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/live-feed")
async def websocket_live_feed(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    Authenticated real-time election monitoring WebSocket.

    Connection format:
    /ws/live-feed?token=YOUR_JWT_TOKEN
    """

    # A token is mandatory.
    payload = decode_access_token(token)

    # Reject invalid or expired tokens.
    if not payload:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION
        )
        return

    # Require a valid subject in the JWT.
    username = payload.get("sub")

    if not username:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION
        )
        return

    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            await websocket.send_json(
                {
                    "status": "acknowledged",
                    "received": data,
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(websocket)