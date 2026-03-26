from django.urls import path
from . import views

app_name = "lobbies"

urlpatterns = [
    # Main page after login (choose host or join)
    path("lobby/", views.lobby_home, name="home"),
    path("lobby/create/", views.create_lobby, name="create"),
    path("lobby/join/", views.join_lobby, name="join"),
    path("lobby/<str:code>/kick/<int:user_id>/", views.kick_player, name="kick_player"),
]