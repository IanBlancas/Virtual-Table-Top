# board/boardHandler.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import logging

logger = logging.getLogger(__name__)

# In-memory store for the most recent public board state per lobby code.
# NOTE: This is process-local; for multi-worker deployments use a shared cache/DB.
BOARD_STATES = {}

class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.code = self.scope["url_route"]["kwargs"]["code"]
        self.group_name = f"board_{self.code}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # If we have a stored public board state for this lobby, send it to the
        # newly connected client so they get the current public board.
        try:
            state = BOARD_STATES.get(self.code)
            if state:
                await self.send(text_data=json.dumps({"type": "board_state", "state": state}))
                logger.debug('Sent stored board_state to %s (items=%s)', self.channel_name, len(state.get('items',[]) if isinstance(state, dict) else 0))
        except Exception:
            logger.exception('Failed to send stored board_state on connect')

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def session_mode_changed(self, event):
        await self.send(text_data=json.dumps({
            "type": "session_mode_changed",
            "session_mode": event["session_mode"],
        }))

    async def players_updated(self, event):
        await self.send(text_data=json.dumps({
            "type": "players_updated",
            "players": event["players"],
        }))

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            msg = json.loads(text_data)
        except json.JSONDecodeError:
            return

        # Handle chat messages
        if msg.get("type") == "chat_message":
            logger.info(f'Chat message received: {msg}')
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.broadcast",
                    "username": msg.get("username", "Anonymous"),
                    "message": msg.get("message", ""),
                    "timestamp": msg.get("timestamp"),
                }
            )
            return

        # Re-broadcast exactly what the sender sent.
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "board.broadcast",
                "payload": msg,
            }
        )

    async def board_broadcast(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def chat_broadcast(self, event):
        logger.info(f'Chat broadcast: {event}')
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "username": event["username"],
            "message": event["message"],
            "timestamp": event["timestamp"],
        }))