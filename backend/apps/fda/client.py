"""
openFDA API Client
Handles all HTTP communication with api.fda.gov, query building,
response normalization, and cache-aside logic.
"""
import hashlib
import json
import logging
from datetime import timedelta
from typing import Optional

import httpx
from django.conf import settings
from django.utils import timezone

from .models import FDAQueryCache

logger = logging.getLogger(__name__)


# ── Endpoint registry ────────────────────────────────────────────────────────
ENDPOINTS = {
    "drug_event":       "/drug/event.json",
    "drug_label":       "/drug/label.json",
    "drug_ndc":         "/drug/ndc.json",
    "drug_drugsfda":    "/drug/drugsfda.json",
    "drug_enforcement": "/drug/enforcement.json",
    "device_event":     "/device/event.json",
    "device_recall":    "/device/recall.json",
    "food_enforcement": "/food/enforcement.json",
}


def _make_cache_key(endpoint: str, params: dict) -> str:
    raw = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_ttl(endpoint: str, is_count: bool) -> int:
    if is_count:
        return settings.FDA_CACHE_TTL.get("count_query", 43200)
    return settings.FDA_CACHE_TTL.get(endpoint, 21600)


class OpenFDAClient:
    def __init__(self):
        self.base_url = settings.OPENFDA_BASE_URL
        self.api_key = settings.OPENFDA_API_KEY
        self.timeout = 30.0

    def _build_url(self, endpoint_key: str) -> str:
        path = ENDPOINTS.get(endpoint_key)
        if not path:
            raise ValueError(f"Unknown endpoint: {endpoint_key}")
        return f"{self.base_url}{path}"

    def _build_params(self, query_params: dict) -> dict:
        params = dict(query_params)
        if self.api_key:
            params["api_key"] = self.api_key
        return params

    def _check_cache(self, cache_key: str) -> Optional[dict]:
        try:
            cached = FDAQueryCache.objects.get(cache_key=cache_key)
            if cached.is_valid():
                cached.hit_count += 1
                cached.save(update_fields=["hit_count"])
                logger.debug(f"Cache HIT: {cache_key[:16]}...")
                return cached.response_data
            else:
                cached.delete()
        except FDAQueryCache.DoesNotExist:
            pass
        return None

    def _write_cache(self, cache_key: str, endpoint: str, query_params: dict,
                     data: dict, is_count: bool) -> None:
        ttl_seconds = _get_ttl(endpoint, is_count)
        expires_at = timezone.now() + timedelta(seconds=ttl_seconds)
        total = data.get("meta", {}).get("results", {}).get("total", 0)

        FDAQueryCache.objects.update_or_create(
            cache_key=cache_key,
            defaults={
                "endpoint": endpoint,
                "query_params": query_params,
                "response_data": data,
                "total_results": total,
                "ttl_expires": expires_at,
            }
        )

    def query(self, endpoint: str, search: str = "", count: str = "",
              limit: int = 20, skip: int = 0, sort: str = "") -> dict:
        """
        Execute an openFDA query with cache-aside.

        Args:
            endpoint:  One of ENDPOINTS keys (e.g. "drug_event")
            search:    openFDA search expression (e.g. 'patient.drug.openfda.brand_name:"Aspirin"')
            count:     Field to aggregate/count (e.g. 'patient.reaction.reactionmeddrapt.exact')
            limit:     Number of results (max 1000)
            skip:      Pagination offset
            sort:      Sort field (e.g. 'receivedate:desc')
        """
        is_count = bool(count)
        query_params = {}
        if search:
            query_params["search"] = search
        if count:
            query_params["count"] = count
        if limit and not is_count:
            query_params["limit"] = min(limit, 1000)
        if skip:
            query_params["skip"] = skip
        if sort:
            query_params["sort"] = sort

        cache_key = _make_cache_key(endpoint, query_params)

        # Cache hit
        cached = self._check_cache(cache_key)
        if cached is not None:
            return {"data": cached, "from_cache": True}

        # Live fetch
        url = self._build_url(endpoint)
        params = self._build_params(query_params)

        try:
            logger.info(f"openFDA fetch: {endpoint} | {query_params}")
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

            self._write_cache(cache_key, endpoint, query_params, data, is_count)
            return {"data": data, "from_cache": False}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # openFDA returns 404 when no results match — not an error
                return {"data": {"meta": {}, "results": []}, "from_cache": False}
            logger.error(f"openFDA HTTP error: {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"openFDA request failed: {e}")
            raise


# Singleton
fda_client = OpenFDAClient()
