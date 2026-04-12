from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Lobby, LobbyMember


@login_required
def lobby_home(request):
    # This is the page after login: Host or Join
    return render(request, "lobbies/homePage.html")


@login_required
def create_lobby(request):
    # Host creates a NEW lobby each time (fresh slate)
    lobby = Lobby.objects.create(host=request.user)
    LobbyMember.objects.get_or_create(lobby=lobby, user=request.user)
    broadcast_player_list(lobby)

    # go straight to the board with the code in the URL
    return redirect("board:board_with_code", code=lobby.code)


@login_required
def join_lobby(request):
    if request.method == "POST":
        code = (request.POST.get("code") or "").strip().upper()

        lobby = Lobby.objects.filter(code=code).first()
        if not lobby:
            messages.error(request, "Lobby code not found.")
            return redirect("lobbies:home")

        if lobby.status != Lobby.Status.OPEN:
            messages.error(request, "That lobby is closed.")
            return redirect("lobbies:home")

        LobbyMember.objects.get_or_create(lobby=lobby, user=request.user)

        broadcast_player_list(lobby)

        # go straight to the board with that code
        return redirect("board:board_with_code", code=lobby.code)

    # If someone hits /lobby/join directly in browser
    return redirect("lobbies:home")


@login_required
def kick_player(request, code, user_id):
    if request.method != "POST":
        return redirect("board:board_with_code", code=code)

    lobby = get_object_or_404(Lobby, code=code)

    # only host can kick
    if request.user != lobby.host:
        messages.error(request, "Only the host can kick players.")
        return redirect("board:board_with_code", code=code)

    # host cannot kick themselves
    if lobby.host.id == user_id:
        messages.error(request, "Host cannot kick themselves.")
        return redirect("board:board_with_code", code=code)

    member = LobbyMember.objects.filter(lobby=lobby, user_id=user_id).first()

    if member:
        member.delete()
        broadcast_player_list(lobby)
        messages.success(request, "Player kicked.")

    return redirect("board:board_with_code", code=code)


@login_required
def change_session_mode(request, code):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST required"}, status=400)

    lobby = get_object_or_404(Lobby, code=code)

    if request.user != lobby.host:
        return JsonResponse(
            {"success": False, "error": "Only the host can change session mode."},
            status=403
        )

    new_mode = request.POST.get("session_mode")

    if new_mode not in [Lobby.SessionMode.MONARCHY, Lobby.SessionMode.ANARCHY]:
        return JsonResponse({"success": False, "error": "Invalid session mode."}, status=400)

    lobby.session_mode = new_mode
    lobby.save()

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"board_{lobby.code}",
        {
            "type": "session_mode_changed",
            "session_mode": lobby.session_mode,
        }
    )

    return JsonResponse({
        "success": True,
        "session_mode": lobby.session_mode
    })

def broadcast_player_list(lobby):
    channel_layer = get_channel_layer()

    members = LobbyMember.objects.select_related("user").filter(lobby=lobby)

    players = []
    for member in members:
        players.append({
            "id": member.user.id,
            "username": member.user.username,
            "is_host_member": member.user.id == lobby.host.id,
        })

    async_to_sync(channel_layer.group_send)(
        f"board_{lobby.code}",
        {
            "type": "players_updated",
            "players": players,
        }
    )