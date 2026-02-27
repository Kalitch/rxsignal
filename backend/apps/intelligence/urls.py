from django.urls import path
from . import views

urlpatterns = [
    path("query/", views.NLQueryView.as_view(), name="ai-query"),
    path("summarize/", views.SummarizeView.as_view(), name="ai-summarize"),
    path("history/", views.AIQueryHistoryView.as_view(), name="ai-history"),
]
