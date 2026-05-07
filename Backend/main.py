from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow the frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep track of all connected users
connected_clients = []

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    # User connects
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"{username} joined the chat")

    # Tell everyone someone joined
    await broadcast(f"{username} joined the chat 👋", sender="System")

    try:
        while True:
            # Wait for a message from this user
            message = await websocket.receive_text()

            # Send it to everyone
            await broadcast(message, sender=username)

    except WebSocketDisconnect:
        # User disconnected
        connected_clients.remove(websocket)
        await broadcast(f"{username} left the chat", sender="System")
        print(f"{username} left the chat")


async def broadcast(message: str, sender: str):
    # Send message to every connected client
    for client in connected_clients:
        await client.send_text(f"{sender}:{message}")