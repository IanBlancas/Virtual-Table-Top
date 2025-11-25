from django.db import models
from django.conf import settings


class CardImage(models.Model):
	"""Stores uploaded images for custom cards."""
	uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
	# Use ImageField so we can validate and process images (requires Pillow)
	image = models.ImageField(upload_to='card_images/')
	uploaded_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"CardImage(id={self.id}, uploaded_by={self.uploaded_by})"
