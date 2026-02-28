from django.contrib import admin
from .models import Lobby, LobbyMember


@admin.register(Lobby)
class LobbyAdmin(admin.ModelAdmin):
    list_display = ("code", "host", "status", "created_at")
    search_fields = ("code", "host__username")


@admin.register(LobbyMember)
class LobbyMemberAdmin(admin.ModelAdmin):
    list_display = ("lobby", "user", "joined_at")
    search_fields = ("lobby__code", "user__username")
