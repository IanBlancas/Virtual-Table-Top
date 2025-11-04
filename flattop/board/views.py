from django.http import HttpResponse
from django.template import loader

def board(request):
    template = loader.get_template('board/layout.html')
    return HttpResponse(template.render())

def login_page(request):
    template = loader.get_template('board/loginPage.html')
    return HttpResponse(template.render({}, request))
# Create your views here.
