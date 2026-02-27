import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .client import mistral_client
from .models import AIQueryLog
from apps.fda.client import fda_client

logger = logging.getLogger(__name__)


class NLQueryView(APIView):
    """
    POST /api/ai/query/
    Natural language → openFDA query → results + summary.

    Body: { "prompt": "show me adverse events for Aspirin" }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            return Response({"error": "prompt is required"}, status=400)

        log = AIQueryLog(nl_prompt=prompt)

        try:
            # Step 1: Translate NL → FDA query
            fda_query = mistral_client.translate_to_fda_query(prompt)
            log.generated_query = fda_query
            log.endpoint_used = fda_query.get("endpoint", "")

            # Step 2: Execute the FDA query
            result = fda_client.query(
                endpoint=fda_query["endpoint"],
                search=fda_query.get("search", ""),
                count=fda_query.get("count", ""),
                limit=fda_query.get("limit", 20),
            )
            fda_data = result["data"]
            results = fda_data.get("results", [])
            total = fda_data.get("meta", {}).get("results", {}).get("total", 0)

            # Step 3: Summarize results
            drug_hint = prompt  # Use the prompt as context hint
            summary = mistral_client.summarize_results(drug_hint, results, total)
            log.summary = summary
            log.save()

            return Response({
                "prompt": prompt,
                "generated_query": fda_query,
                "total_results": total,
                "results": results[:20],
                "summary": summary,
                "from_cache": result["from_cache"],
            })

        except ConnectionError as e:
            log.error = str(e)
            log.save()
            return Response(
                {"error": str(e), "hint": "Make sure LM Studio is running with a loaded model."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            log.error = str(e)
            log.save()
            logger.exception("AI query failed")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SummarizeView(APIView):
    """
    POST /api/ai/summarize/
    Summarize a set of FDA results already fetched.

    Body: { "drug_name": "...", "results": [...], "total": 1234 }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        drug_name = request.data.get("drug_name", "Unknown Drug")
        results = request.data.get("results", [])
        total = request.data.get("total", 0)

        try:
            summary = mistral_client.summarize_results(drug_name, results, total)
            return Response({"summary": summary})
        except ConnectionError as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class AIQueryHistoryView(APIView):
    """GET /api/ai/history/ — last 20 AI queries"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        logs = AIQueryLog.objects.all()[:20]
        return Response([{
            "id": l.id,
            "prompt": l.nl_prompt,
            "endpoint": l.endpoint_used,
            "summary": l.summary[:200] if l.summary else "",
            "created_at": l.created_at,
        } for l in logs])
