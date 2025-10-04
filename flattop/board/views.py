from django.shortcuts import render

def grid(request):
    return render(request, "board/grid.html")