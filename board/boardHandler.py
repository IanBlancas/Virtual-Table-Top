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

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            msg = json.loads(text_data)
        except json.JSONDecodeError:
            return

        # If this is a board_state message with no public items and no drawing,
        # ignore it to avoid clearing the shared board when a client only has
        # private items.
        try:
            if isinstance(msg, dict) and msg.get('type') == 'board_state':
                state = msg.get('state') or {}
                items = state.get('items') if isinstance(state, dict) else None
                strokes = (state.get('drawing') or {}).get('strokes') if isinstance(state.get('drawing'), dict) else None
                items_len = len(items) if isinstance(items, list) else 0
                strokes_len = len(strokes) if isinstance(strokes, list) else 0
                logger.debug('Received board_state: items=%s strokes=%s', items_len, strokes_len)
                if items_len == 0 and strokes_len == 0:
                    # drop empty state
                    logger.info('Ignoring empty board_state from %s', self.channel_name)
                    return
                # Persist the latest public board state for this lobby
                try:
                    BOARD_STATES[self.code] = state
                    logger.debug('Persisted board_state for %s (items=%s)', self.code, items_len)
                except Exception:
                    logger.exception('Failed to persist board_state for %s', self.code)
        except Exception:
            logger.exception('Error inspecting incoming board_state')

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