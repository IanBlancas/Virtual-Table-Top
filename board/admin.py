from django.contrib import admin
from .models import CardImage, BoardState

@admin.register(CardImage)
class CardImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'uploaded_by', 'uploaded_at')
    readonly_fields = ('uploaded_at',)

@admin.register(BoardState)
class BoardStateAdmin(admin.ModelAdmin):
    list_display = ('key', 'updated_at', 'updated_by')
    readonly_fields = ('updated_at',)
