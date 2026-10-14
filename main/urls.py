from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("catalog/", views.catalog, name="catalog"),
    # Mashina ID (pk) bo'yicha topiladi; slug faqat chiroyli URL uchun
    path("car/<int:pk>/", views.car_detail),
    path("car/<int:pk>/<slug:slug>/", views.car_detail, name="car_detail"),
    path("car/<slug:slug>/", views.car_by_slug),  # eski havolalar uchun
    path("sold/", views.sold, name="sold"),
    path("favorites/", views.favorites, name="favorites"),
    path("favorites/cards/", views.favorites_cards, name="favorites_cards"),
    path("sell/", views.sell, name="sell"),
    path("contact/", views.contact, name="contact"),
    path("about/", views.about, name="about"),
]
