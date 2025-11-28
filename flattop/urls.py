from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LoginView
from board import views as board_views

urlpatterns = [
    path('admin/', admin.site.urls),

    path(
        'accounts/login/',
        LoginView.as_view(template_name='board/login.html'),
        name='login'
    ),

    path('accounts/register/', board_views.register, name='register'),

    path('accounts/', include('django.contrib.auth.urls')),

    path('', RedirectView.as_view(url='/accounts/login/', permanent=False)),

    path('', include('board.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
