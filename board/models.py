from django.db import models
from django.conf import settings
from django.contrib.auth.models import User


class CardImage(models.Model):
	"""Stores uploaded images for custom cards."""
	uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
	# Use ImageField so we can validate and process images (requires Pillow)
	image = models.ImageField(upload_to='card_images/')
	uploaded_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"CardImage(id={self.id}, uploaded_by={self.uploaded_by})"

class BoardState(models.Model):
    """
    Minimal shared-state store.
    For now we keep a single shared board (one row).
    Later we can add lobby_id / board_id / per-user boards.
    """
    key = models.CharField(max_length=64, unique=True, default="main")
    state = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"BoardState({self.key})"