from django.db import models
from django.utils import timezone


class FDAQueryCache(models.Model):
    """Cache-aside store for openFDA API responses."""
    cache_key = models.CharField(max_length=64, unique=True, db_index=True)  # SHA-256 hash
    endpoint = models.CharField(max_length=60)   # e.g. "drug_event"
    query_params = models.JSONField()
    response_data = models.JSONField()
    total_results = models.IntegerField(default=0)
    ttl_expires = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    hit_count = models.IntegerField(default=0)

    class Meta:
        db_table = "fda_query_cache"
        indexes = [models.Index(fields=["endpoint", "ttl_expires"])]

    def is_valid(self):
        return timezone.now() < self.ttl_expires

    def __str__(self):
        return f"{self.endpoint} | expires {self.ttl_expires}"
