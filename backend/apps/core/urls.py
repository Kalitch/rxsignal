from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("searches/", views.SavedSearchListCreateView.as_view(), name="saved-searches"),
    path("searches/<int:pk>/", views.SavedSearchDestroyView.as_view(), name="saved-search-delete"),
    path("watchlist/", views.WatchlistListCreateView.as_view(), name="watchlist"),
    path("watchlist/<int:pk>/", views.WatchlistDestroyView.as_view(), name="watchlist-delete"),
]
