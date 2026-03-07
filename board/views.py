from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth import login as auth_login
from django.shortcuts import redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.conf import settings
from functools import wraps
import hashlib, os

from .models import CardImage
from django.views.decorators.csrf import csrf_exempt

def ajax_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

def login_page(request):
    """
    Render combined page:
      - Login form posts to built-in /accounts/login/
      - Register form posts to /accounts/register/
    """
    template = loader.get_template('board/login.html')
    next_url = request.GET.get('next', '')  # preserve next if sent

    ctx = {
        'login_form': AuthenticationForm(request),
        'reg_form': UserCreationForm(),
        'next': next_url,
    }
    return HttpResponse(template.render(ctx, request))

@require_POST
def register(request):
    """
    Handle registration (username + password only).
    On success: log the user in and redirect to next or LOGIN_REDIRECT_URL.
    """
    form = UserCreationForm(request.POST)
    next_url = request.POST.get('next', '')

    if form.is_valid():
        user = form.save()
        auth_login(request, user)

        if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
            return redirect(next_url)
        return redirect(settings.LOGIN_REDIRECT_URL or '/')
    else:
        template = loader.get_template('board/login.html')
        ctx = {
            'login_form': AuthenticationForm(request),
            'reg_form': form,
            'next': next_url,
        }
        return HttpResponse(template.render(ctx, request))

@login_required
def board(request, code=None):
    template = loader.get_template('board/layout.html')
    return HttpResponse(template.render({"lobby_code": code }, request))

@require_POST
@ajax_login_required
def upload_card_image(request):
    f = request.FILES.get('image')
    if not f:
        return JsonResponse({'error': 'No file uploaded (field name should be "image").'}, status=400)
    hasher = hashlib.sha256()
    for chunk in f.chunks():
        hasher.update(chunk)
    incoming_hash = hasher.hexdigest()

    matched_path = None
    for ci in CardImage.objects.all():
        try:
            existing_abspath = ci.image.path
        except Exception:
            continue
        if not os.path.exists(existing_abspath):
            continue
        h = hashlib.sha256()
        with open(existing_abspath, 'rb') as ef:
            for chunk in iter(lambda: ef.read(8192), b''):
                h.update(chunk)
        if h.hexdigest() == incoming_hash:
            matched_path = ci.image.name
            break

    if matched_path:
        ci = CardImage.objects.create(uploaded_by=request.user, image=matched_path)
        return JsonResponse({'url': ci.image.url, 'id': ci.id, 'duplicate': True})

    try:
        f.seek(0)
    except Exception:
        pass

    ci = CardImage.objects.create(uploaded_by=request.user, image=f)
    return JsonResponse({'url': ci.image.url, 'id': ci.id, 'duplicate': False})


@require_POST
@ajax_login_required
def upload_sound_file(request):
    """Accept a single audio file (field name 'audio'), save to MEDIA_ROOT/sounds/, and return its URL."""
    f = request.FILES.get('audio')
    if not f:
        return JsonResponse({'error': 'No file uploaded (field name should be "audio").'}, status=400)

    # basic MIME check
    content_type = getattr(f, 'content_type', '')
    if not content_type.startswith('audio'):
        return JsonResponse({'error': 'Uploaded file is not an audio file.'}, status=400)

    sounds_dir = os.path.join(settings.MEDIA_ROOT, 'sounds')
    os.makedirs(sounds_dir, exist_ok=True)

    # create a unique filename to avoid collisions
    import time, re
    original = f.name
    # sanitize filename (very small, conservative sanitization)
    safe_name = re.sub(r'[^A-Za-z0-9._-]', '_', original)
    filename = f"{int(time.time())}_{safe_name}"
    dest_path = os.path.join(sounds_dir, filename)

    with open(dest_path, 'wb') as out:
        for chunk in f.chunks():
            out.write(chunk)

    # build media URL (ensure forward slashes)
    media_url = settings.MEDIA_URL
    if not media_url.endswith('/'):
        media_url = media_url + '/'
    url = f"{media_url}sounds/{filename}"

    return JsonResponse({'url': url, 'name': original})
