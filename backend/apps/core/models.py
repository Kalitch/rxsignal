from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"


class SavedSearch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_searches")
    label = models.CharField(max_length=120)
    endpoint = models.CharField(max_length=60)   # e.g. "drug_event"
    query_params = models.JSONField()             # raw query dict
    last_run = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_searches"
        ordering = ["-created_at"]


class DrugWatchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="watchlist")
    drug_name = models.CharField(max_length=200)
    ndc = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "drug_watchlist"
        unique_together = [["user", "drug_name"]]
