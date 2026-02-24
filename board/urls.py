from django.urls import path
from . import views

urlpatterns = [
    path('board/', views.board, name='board'),
    path('board/api/upload_card_image/', views.upload_card_image, name='upload_card_image'),
    path('board/api/upload_board_image/', views.upload_board_image, name='upload_board_image'),
    path('api/upload_image/', views.upload_image, name='upload_image'),  # generic image upload (for both cards and board)
    path('board/api/state/', views.board_state, name='board_state'),
]
