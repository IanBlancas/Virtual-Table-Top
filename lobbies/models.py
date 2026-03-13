from django.conf import settings
from django.db import models
from django.utils import timezone
import random

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # avoids O/0 and I/1


def generate_code(length: int = 6) -> str:
    return "".join(random.choice(CODE_ALPHABET) for _ in range(length))


class Lobby(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"

    code = models.CharField(max_length=12, unique=True, db_index=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hosted_lobbies")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(default=timezone.now)

    @property
    def display_name(self):
        return f"{self.host.username}'s Lobby"

    def save(self, *args, **kwargs):
        # auto-generate a unique code when the lobby is first created
        if not self.code:
            for _ in range(20):  # retry to avoid collisions
                candidate = generate_code()
                if not Lobby.objects.filter(code=candidate).exists():
                    self.code = candidate
                    break
            else:
                raise RuntimeError("Could not generate a unique lobby code.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Lobby {self.code} ({self.status})"


class LobbyMember(models.Model):
    lobby = models.ForeignKey(Lobby, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lobby_memberships")
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["lobby", "user"], name="unique_lobby_member")
        ]

    def __str__(self):
        return f"{self.user} in {self.lobby.code}"
