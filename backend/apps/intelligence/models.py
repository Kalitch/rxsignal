"""
Intelligence App — Mistral via LM Studio
Handles NL→FDA query translation and result summarization.
"""
import logging
import json
import re
import httpx
from django.conf import settings
from django.db import models

logger = logging.getLogger(__name__)


# ── Model ─────────────────────────────────────────────────────────────────────
class AIQueryLog(models.Model):
    nl_prompt = models.TextField()
    generated_query = models.JSONField(null=True, blank=True)
    endpoint_used = models.CharField(max_length=60, blank=True)
    summary = models.TextField(blank=True)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_query_log"
        ordering = ["-created_at"]
