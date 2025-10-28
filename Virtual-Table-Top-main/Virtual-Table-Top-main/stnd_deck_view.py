#for the views file
from django.shortcuts import render
import random

def deck_view(request):
    suits = [
        {"symbol": "♠", "color": "black"},
        {"symbol": "♥", "color": "red"},
        {"symbol": "♣", "color": "black"},
        {"symbol": "♦", "color": "red"},
    ]
    ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

    deck = [{"rank": r, "suit": s["symbol"], "color": s["color"]} for s in suits for r in ranks]
    random.shuffle(deck)  # optional

    return render(request, "cards.html", {"deck": deck})
