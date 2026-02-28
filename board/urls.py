from django.urls import path
from . import views

app_name = "board"

urlpatterns = [
    path('board/', views.board, name='board'),
    path('board/api/upload_card_image/', views.upload_card_image, name='upload_card_image'),
<<<<<<< HEAD
    path('board/api/upload_sound/', views.upload_sound_file, name='upload_sound_file'),
=======
    path("board/<str:code>/", views.board, name="board_with_code"),
>>>>>>> Multiplayer_Lobby
]