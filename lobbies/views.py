from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

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

        # go straight to the board with that code
        return redirect("board:board_with_code", code=lobby.code)

    # If someone hits /lobby/join directly in browser
    return redirect("lobbies:home")
