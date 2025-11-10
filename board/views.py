from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.conf import settings
from functools import wraps
import hashlib
import os

from .models import CardImage


def ajax_login_required(view_func):
    """Like @login_required but returns JSON error for AJAX requests instead of redirecting."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def login_page(request):
    template = loader.get_template('board/loginPage.html')
    return HttpResponse(template.render({}, request))


@login_required
def board(request):
    template = loader.get_template('board/layout.html')
    return HttpResponse(template.render({}, request))


@require_POST
@ajax_login_required
def upload_card_image(request):
    """Accepts a single file in 'image' and returns JSON { url: <media url> }."""
    f = request.FILES.get('image')
    if not f:
        return JsonResponse({'error': 'No file uploaded (field name should be "image").'}, status=400)
    # Compute SHA256 of uploaded content to detect duplicates
    hasher = hashlib.sha256()
    for chunk in f.chunks():
        hasher.update(chunk)
    incoming_hash = hasher.hexdigest()

    # Look for an existing file with the same content hash by scanning
    # current CardImage files. This avoids creating duplicate files.
    matched_path = None
    for ci in CardImage.objects.all():
        try:
            existing_abspath = ci.image.path
        except Exception:
            # skip if file is missing or path cannot be determined
            continue
        if not os.path.exists(existing_abspath):
            continue
        h = hashlib.sha256()
        with open(existing_abspath, 'rb') as ef:
            for chunk in iter(lambda: ef.read(8192), b''):
                h.update(chunk)
        if h.hexdigest() == incoming_hash:
            matched_path = ci.image.name  # relative media path
            break

    if matched_path:
        # Do not re-save the file; create DB record pointing to existing file
        ci = CardImage.objects.create(uploaded_by=request.user, image=matched_path)
        return JsonResponse({'url': ci.image.url, 'id': ci.id, 'duplicate': True})

    # No duplicate found; rewind UploadedFile and save normally
    # Uploaded file was consumed by chunks() iteration, so re-open from InMemoryUploadedFile
    # Easiest approach: reopen from request.FILES again (Django provides same object) by
    # resetting file pointer if possible.
    try:
        f.seek(0)
    except Exception:
        pass

    ci = CardImage.objects.create(uploaded_by=request.user, image=f)
    return JsonResponse({'url': ci.image.url, 'id': ci.id, 'duplicate': False})
