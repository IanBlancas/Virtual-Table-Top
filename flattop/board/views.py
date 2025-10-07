from django.http import HttpResponse
from django.template import loader

def board(request):
    template = loader.get_template('board/layout.html')
    return HttpResponse(template.render())
# Create your views here.
