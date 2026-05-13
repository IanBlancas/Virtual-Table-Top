# board/boardHandler.py
import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from lobbies.models import Lobby, LobbyMember

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

        # If we have a stored public board state for this lobby,
        # send it to the newly connected client.
        try:
            state = BOARD_STATES.get(self.code)

            if state:
                await self.send(text_data=json.dumps({
                    "type": "board_state",
                    "state": state
                }))

                logger.debug(
                    'Sent stored board_state to %s (items=%s)',
                    self.channel_name,
                    len(state.get('items', []) if isinstance(state, dict) else 0)
                )

        except Exception:
            logger.exception('Failed to send stored board_state on connect')

    async def disconnect(self, close_code):
        # Remove player from lobby when they leave/disconnect
        await self.remove_player_from_lobby()

        # Broadcast updated player list to everyone
        await self.broadcast_updated_players()

        # Remove websocket from channel group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

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

        # Save latest board state if sent
        if msg.get("type") == "board_state":
            BOARD_STATES[self.code] = msg.get("state")

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

    @database_sync_to_async
    def remove_player_from_lobby(self):
        lobby = Lobby.objects.filter(code=self.code).first()

        if lobby and self.scope["user"].is_authenticated:
            LobbyMember.objects.filter(
                lobby=lobby,
                user=self.scope["user"]
            ).delete()

    @database_sync_to_async
    def get_players(self):
        lobby = Lobby.objects.filter(code=self.code).first()

        if not lobby:
            return []

        members = LobbyMember.objects.select_related("user").filter(lobby=lobby)

        players = []

        for member in members:
            players.append({
                "id": member.user.id,
                "username": member.user.username,
                "is_host_member": member.user.id == lobby.host_id,
            })

        return players

    async def broadcast_updated_players(self):
        players = await self.get_players()

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "players_updated",
                "players": players,
            }
        )
    
    async def player_kicked(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_kicked",
            "user_id": event["user_id"],
        }))