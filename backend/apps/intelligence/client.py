"""
LM Studio / Mistral Client
Calls the local OpenAI-compatible inference server.
"""
import json
import logging
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

QUERY_TRANSLATION_SYSTEM = """You are an openFDA API query expert. Your ONLY job is to convert a user's natural language question into a valid openFDA API query.

You MUST respond with a JSON object only — no prose, no explanation, no markdown.

JSON format:
{
  "endpoint": "<one of: drug_event | drug_label | drug_ndc | drug_drugsfda | drug_enforcement | device_event | device_recall | food_enforcement>",
  "search": "<openFDA search expression or empty string>",
  "count": "<field to count/aggregate, or empty string>",
  "limit": <integer 1-100>
}

openFDA search syntax rules:
- String match: field:"value"
- AND: field1:"val1"+AND+field2:"val2"
- OR: field1:"val1"+field2:"val2"
- Drug brand name: patient.drug.openfda.brand_name:"DrugName"
- Drug generic name: patient.drug.openfda.generic_name:"DrugName"
- Reaction term: patient.reaction.reactionmeddrapt.exact:"Nausea"
- Serious flag: serious:1 (serious) or serious:2 (non-serious)
- Count reactions: patient.reaction.reactionmeddrapt.exact
- Count top drugs: patient.drug.openfda.brand_name.exact
- Recall classification: classification:"Class I"

Examples:
User: "show me adverse events for Ozempic"
{"endpoint":"drug_event","search":"patient.drug.openfda.brand_name:\\"Ozempic\\"","count":"","limit":20}

User: "what are the most common side effects of metformin"
{"endpoint":"drug_event","search":"patient.drug.openfda.generic_name:\\"metformin\\"","count":"patient.reaction.reactionmeddrapt.exact","limit":10}

User: "recent class I drug recalls"
{"endpoint":"drug_enforcement","search":"classification:\\"Class I\\"","count":"","limit":20}
"""

SUMMARIZATION_SYSTEM = """You are a pharmaceutical safety analyst. Summarize FDA adverse event data in clear, plain English for a health professional audience.

Be concise (3-5 sentences). Include: total report count, most common reactions, serious/fatal percentage if available, and any notable safety signals.

Do not speculate beyond the data. Do not give medical advice.
"""


class MistralClient:
    def __init__(self):
        self.base_url = settings.LMSTUDIO_BASE_URL
        self.model = settings.LMSTUDIO_MODEL
        self.timeout = settings.LMSTUDIO_TIMEOUT

    def _chat(self, system: str, user_message: str, temperature: float = 0.3) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": 500,
        }
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except httpx.ConnectError:
            raise ConnectionError(
                "LM Studio is not running. Start LM Studio and load a Mistral model, "
                f"then ensure it's serving at {self.base_url}"
            )
        except Exception as e:
            logger.error(f"Mistral request failed: {e}")
            raise

    def translate_to_fda_query(self, nl_prompt: str) -> dict:
        """Convert natural language to openFDA query parameters."""
        raw = self._chat(QUERY_TRANSLATION_SYSTEM, nl_prompt, temperature=0.1)
        # Strip any markdown code fences
        raw = raw.strip().strip("```json").strip("```").strip()
        return json.loads(raw)

    def summarize_results(self, drug_name: str, results: list, total: int) -> str:
        """Generate a plain-English safety summary from FAERS results."""
        # Prepare a condensed context for the model
        context = f"Drug: {drug_name}\nTotal reports in dataset: {total}\n"
        if results:
            reactions = [r.get("patient", {}).get("reaction", []) for r in results[:10]]
            flat_reactions = []
            for rx_list in reactions:
                for rx in rx_list:
                    flat_reactions.append(rx.get("reactionmeddrapt", ""))
            context += f"Sample reactions from first 10 reports: {', '.join(flat_reactions[:20])}\n"

        return self._chat(SUMMARIZATION_SYSTEM, context, temperature=0.4)


mistral_client = MistralClient()
