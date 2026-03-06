from django.urls import re_path
from .boardHandler import BoardConsumer

websocket_urlpatterns = [
    re_path(r"ws/board/(?P<code>[^/]+)/$", BoardConsumer.as_asgi()),
]