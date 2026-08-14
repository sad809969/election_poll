import json
from typing import List, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.security import decode_access_token  # Adjust import based on your JWT decoder

router = APIRouter(prefix="/ws", tags=["WebSockets"])


class ConnectionManager:
    def __init__(self):
        # Store active connections: list of WebSocket objects
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Broadcast a JSON message to all connected clients (e.g., Next.js Admin Dashboard)."""
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected_clients.append(connection)

        # Clean up stale connections
        for conn in disconnected_clients:
            self.disconnect(conn)


manager = ConnectionManager()


@router.websocket("/live-feed")
async def websocket_live_feed(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    WebSocket endpoint for real-time election monitoring.
    Expects JWT token in query parameter: /ws/live-feed?token=YOUR_JWT_TOKEN
    """
    # Optional JWT validation for WS security
    if token:
        try:
            payload = decode_access_token(token)
            if not payload:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(websocket)
    try:
        # Keep connection open and receive optional ping/pong or filter requests
        while True:
            data = await websocket.receive_text()
            # Client can ping or send channel subscription requests
            await websocket.send_json({"status": "acknowledged", "received": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)