from django.urls import path
from . import views

urlpatterns = [
    path("adverse-events/", views.AdverseEventsView.as_view(), name="adverse-events"),
    path("drug-labels/", views.DrugLabelsView.as_view(), name="drug-labels"),
    path("ndc/", views.NDCLookupView.as_view(), name="ndc-lookup"),
    path("drugsfda/", views.DrugsFDAView.as_view(), name="drugs-fda"),
    path("recalls/", views.RecallsView.as_view(), name="recalls"),
    path("device-events/", views.DeviceEventsView.as_view(), name="device-events"),
    path("dashboard/", views.DashboardStatsView.as_view(), name="dashboard-stats"),
]
