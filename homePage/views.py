from django.shortcuts import render

def homePage(request):
    return render(request, "homePage/homePage.html")

def about(request):
    return render(request, "homePage/about.html")