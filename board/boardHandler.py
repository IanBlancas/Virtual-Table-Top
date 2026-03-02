# board/boardHandler.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.code = self.scope["url_route"]["kwargs"]["code"]
        self.group_name = f"board_{self.code}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            msg = json.loads(text_data)
        except json.JSONDecodeError:
            return

        # Broadcast to everyone in the same lobby
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "board.broadcast",
                "payload": msg,
            }
        )

    async def board_broadcast(self, event):
        await self.send(text_data=json.dumps(event["payload"]))