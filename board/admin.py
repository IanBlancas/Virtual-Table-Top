from django.contrib import admin
from .models import CardImage


@admin.register(CardImage)
class CardImageAdmin(admin.ModelAdmin):
	list_display = ('id', 'uploaded_by', 'uploaded_at')
	readonly_fields = ('uploaded_at',)
