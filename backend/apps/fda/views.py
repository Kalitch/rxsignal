"""
openFDA API Views
Each view maps to a specific FDA endpoint category.
All views use the cache-aside client and normalize responses for the frontend.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings

from .client import fda_client

logger = logging.getLogger(__name__)


def _error(msg: str, code=status.HTTP_502_BAD_GATEWAY):
    return Response({"error": msg}, status=code)


class AdverseEventsView(APIView):
    """
    GET /api/fda/adverse-events/
    Query FAERS adverse event reports.

    Query params:
      drug        — brand or generic name to search
      search      — raw openFDA search string (overrides drug)
      count       — field to count/aggregate
      limit       — results per page (default 20)
      skip        — pagination offset
      serious     — 1 | 2 (filter by serious flag)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        drug = request.query_params.get("drug", "")
        raw_search = request.query_params.get("search", "")
        count_field = request.query_params.get("count", "")
        limit = int(request.query_params.get("limit", 20))
        skip = int(request.query_params.get("skip", 0))
        serious = request.query_params.get("serious", "")

        # Build search expression
        if raw_search:
            search = raw_search
        elif drug:
            parts = [f'(patient.drug.openfda.brand_name:"{drug}" OR patient.drug.openfda.generic_name:"{drug}")']
            if serious:
                parts.append(f"serious:{serious}")
            search = " AND ".join(parts)
        else:
            search = ""

        try:
            result = fda_client.query(
                endpoint="drug_event",
                search=search,
                count=count_field,
                limit=limit,
                skip=skip,
                sort="receivedate:desc" if not count_field else "",
            )
            return Response({
                "from_cache": result["from_cache"],
                **result["data"]
            })
        except Exception as e:
            logger.exception("Adverse events query failed")
            return _error(str(e))


class DrugLabelsView(APIView):
    """
    GET /api/fda/drug-labels/
    Search FDA drug labels (SPL).

    Query params:
      drug     — drug brand or generic name
      search   — raw openFDA search string
      limit
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        drug = request.query_params.get("drug", "")
        raw_search = request.query_params.get("search", "")
        limit = int(request.query_params.get("limit", 5))

        search = raw_search or (
            f'(openfda.brand_name:"{drug}" OR openfda.generic_name:"{drug}")' if drug else ""
        )

        try:
            result = fda_client.query(endpoint="drug_label", search=search, limit=limit)
            return Response({"from_cache": result["from_cache"], **result["data"]})
        except Exception as e:
            logger.exception("Drug labels query failed")
            return _error(str(e))


class NDCLookupView(APIView):
    """
    GET /api/fda/ndc/
    NDC directory lookup.

    Query params:
      drug    — drug name (brand or generic)
      ndc     — exact NDC code
      limit
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        drug = request.query_params.get("drug", "")
        ndc = request.query_params.get("ndc", "")
        limit = int(request.query_params.get("limit", 10))

        if ndc:
            search = f'product_ndc:"{ndc}"'
        elif drug:
            search = f'(brand_name:"{drug}" OR generic_name:"{drug}")'
        else:
            search = ""

        try:
            result = fda_client.query(endpoint="drug_ndc", search=search, limit=limit)
            return Response({"from_cache": result["from_cache"], **result["data"]})
        except Exception as e:
            return _error(str(e))


class DrugsFDAView(APIView):
    """
    GET /api/fda/drugsfda/
    Drugs@FDA — approval history, NDA/ANDA data.

    Query params:
      drug    — drug name
      sponsor — sponsor/manufacturer name
      limit
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        drug = request.query_params.get("drug", "")
        sponsor = request.query_params.get("sponsor", "")
        limit = int(request.query_params.get("limit", 10))

        parts = []
        if drug:
            parts.append(f'(products.brand_name:"{drug}" OR products.active_ingredients.name:"{drug}")')
        if sponsor:
            parts.append(f'sponsor_name:"{sponsor}"')

        search = " AND ".join(parts)

        try:
            result = fda_client.query(endpoint="drug_drugsfda", search=search, limit=limit)
            return Response({"from_cache": result["from_cache"], **result["data"]})
        except Exception as e:
            return _error(str(e))


class RecallsView(APIView):
    """
    GET /api/fda/recalls/
    Unified recalls across drug, device, and food domains.

    Query params:
      domain       — drug | device | food | all (default all)
      recall_class — I | II | III
      firm         — recalling firm name
      limit
      skip
    """
    permission_classes = [permissions.AllowAny]

    DOMAIN_MAP = {
        "drug":   "drug_enforcement",
        "device": "device_recall",
        "food":   "food_enforcement",
    }

    def get(self, request):
        domain = request.query_params.get("domain", "all")
        recall_class = request.query_params.get("recall_class", "")
        firm = request.query_params.get("firm", "")
        limit = int(request.query_params.get("limit", 20))
        skip = int(request.query_params.get("skip", 0))

        search_parts = []
        if recall_class:
            search_parts.append(f'classification:"Class {recall_class}"')
        if firm:
            search_parts.append(f'recalling_firm:"{firm}"')
        search = " AND ".join(search_parts)

        endpoints = (
            [self.DOMAIN_MAP[domain]] if domain in self.DOMAIN_MAP
            else list(self.DOMAIN_MAP.values())
        )

        try:
            results = {}
            for ep in endpoints:
                domain_key = {v: k for k, v in self.DOMAIN_MAP.items()}[ep]
                r = fda_client.query(endpoint=ep, search=search, limit=limit, skip=skip,
                                     sort="recall_initiation_date:desc")
                results[domain_key] = r["data"].get("results", [])

            return Response({"recalls": results})
        except Exception as e:
            return _error(str(e))


class DeviceEventsView(APIView):
    """
    GET /api/fda/device-events/
    MAUDE — medical device adverse events.

    Query params:
      device   — device brand or generic name
      count    — field to aggregate
      limit
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        device = request.query_params.get("device", "")
        count_field = request.query_params.get("count", "")
        limit = int(request.query_params.get("limit", 20))
        skip = int(request.query_params.get("skip", 0))

        search = f'device.brand_name:"{device}"' if device else ""

        try:
            result = fda_client.query(
                endpoint="device_event",
                search=search,
                count=count_field,
                limit=limit,
                skip=skip,
            )
            return Response({"from_cache": result["from_cache"], **result["data"]})
        except Exception as e:
            return _error(str(e))


class DashboardStatsView(APIView):
    """
    GET /api/fda/dashboard/
    Aggregate KPI stats for the main dashboard.
    Uses count queries (heavily cached) to build platform-wide numbers.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        stats = {}

        try:
            # Total adverse event reports
            ae = fda_client.query(endpoint="drug_event", count="serious")
            ae_counts = {item["term"]: item["count"]
                         for item in ae["data"].get("results", [])}
            stats["adverse_events"] = {
                "serious": ae_counts.get("1", 0),
                "non_serious": ae_counts.get("2", 0),
                "total": sum(ae_counts.values()),
            }
        except Exception:
            stats["adverse_events"] = {}

        try:
            # Top reported drugs by adverse event volume
            top_drugs = fda_client.query(
                endpoint="drug_event",
                count="patient.drug.openfda.brand_name.exact",
                limit=10,
            )
            stats["top_drugs"] = top_drugs["data"].get("results", [])[:10]
        except Exception:
            stats["top_drugs"] = []

        try:
            # Recent drug recalls count
            recalls = fda_client.query(
                endpoint="drug_enforcement",
                count="classification.exact",
            )
            stats["drug_recalls"] = recalls["data"].get("results", [])
        except Exception:
            stats["drug_recalls"] = []

        try:
            # Top device event types
            device_types = fda_client.query(
                endpoint="device_event",
                count="event_type.exact",
            )
            stats["device_event_types"] = device_types["data"].get("results", [])
        except Exception:
            stats["device_event_types"] = []

        return Response(stats)
