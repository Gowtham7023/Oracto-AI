import json
import re

from openai import OpenAI
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from app.services.model_service import model_service


class JudgeScores(BaseModel):
    model_config = ConfigDict(extra="forbid")

    correctness: float = Field(ge=0, le=1, strict=True)
    relevance: float = Field(ge=0, le=1, strict=True)
    completeness: float = Field(ge=0, le=1, strict=True)
    instruction_following: float = Field(ge=0, le=1, strict=True)
    reason: str


class QualityService:

    PASS_THRESHOLD = 0.70

    # Dimension Weights (Total = 1.0)
    WEIGHT_CORRECTNESS = 0.40
    WEIGHT_RELEVANCE = 0.20
    WEIGHT_COMPLETENESS = 0.20
    WEIGHT_INSTRUCTION_FOLLOWING = 0.20

    STOP_WORDS = {
        "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or",
        "is", "are", "was", "were", "what", "how", "why", "when", "where",
        "who", "which", "this", "that", "it", "with", "from", "as", "by",
        "be", "do", "does", "did", "can", "could", "would", "should",
        "give", "me", "tell", "explain", "describe", "show", "please",
    }

    FAILURE_PHRASES = [
        "i don't know",
        "i do not know",
        "i cannot answer",
        "i can't answer",
        "unable to answer",
        "error:",
        "an error occurred",
        "failed to generate",
        "internal server error",
        "cannot fulfill this request",
        "model error",
        "rate limit exceeded",
    ]

    def verify_with_heuristic(
        self,
        prompt: str,
        response: str,
    ) -> dict:
        """
        Evaluate LLM response quality using transparent, deterministic heuristics
        across four dimensions: Correctness, Relevance, Completeness, and
        Instruction Following.
        """
        if not response or not response.strip():
            return {
                "quality_score": 0.0,
                "verification_status": "failed",
                "reason": "Empty or whitespace-only response.",
                "verification_method": "heuristic",
                "dimensions": {
                    "correctness": 0.0,
                    "relevance": 0.0,
                    "completeness": 0.0,
                    "instruction_following": 0.0,
                },
            }

        reasons: list[str] = []

        correctness, corr_reasons = self._calculate_correctness(prompt, response)
        relevance, rel_reasons = self._calculate_relevance(prompt, response)
        completeness, comp_reasons = self._calculate_completeness(prompt, response)
        instruction_following, inst_reasons = self._calculate_instruction_following(
            prompt, response
        )

        reasons.extend(corr_reasons)
        reasons.extend(rel_reasons)
        reasons.extend(comp_reasons)
        reasons.extend(inst_reasons)

        weighted_score = (
            correctness * self.WEIGHT_CORRECTNESS
            + relevance * self.WEIGHT_RELEVANCE
            + completeness * self.WEIGHT_COMPLETENESS
            + instruction_following * self.WEIGHT_INSTRUCTION_FOLLOWING
        )

        final_score = max(0.0, min(1.0, weighted_score))
        status = "passed" if final_score >= self.PASS_THRESHOLD else "failed"

        reason_str = (
            "; ".join(reasons)
            if reasons
            else "All quality dimensions passed heuristic evaluation."
        )

        return {
            "quality_score": round(final_score, 4),
            "verification_status": status,
            "reason": reason_str,
            "verification_method": "heuristic",
            "dimensions": {
                "correctness": round(correctness, 4),
                "relevance": round(relevance, 4),
                "completeness": round(completeness, 4),
                "instruction_following": round(instruction_following, 4),
            },
        }

    def verify_with_llm(
        self,
        prompt: str,
        response: str,
    ) -> dict:
        if not settings.gemini_api_key:
            raise RuntimeError("Gemini judge is not configured.")

        judge_models = [
            model
            for model in model_service.get_enabled_models()
            if model.provider == "gemini"
        ]
        if not judge_models:
            raise RuntimeError("No enabled Gemini judge model is configured.")

        judge_model = min(
            judge_models,
            key=lambda model: (
                model.input_cost_per_1k_tokens
                + model.output_cost_per_1k_tokens
            ),
        )

        client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url=(
                "https://generativelanguage.googleapis.com/"
                "v1beta/openai/"
            ),
            timeout=5.0,
            max_retries=0,
        )
        judge_instructions = (
            "Evaluate only the provided prompt and response. Do not assume "
            "facts that are not present. Score each dimension from 0 to 1. "
            "Do not judge the model or provider itself. Do not reward "
            "verbosity by itself. Return ONLY valid JSON with exactly these "
            "fields: correctness, relevance, completeness, "
            "instruction_following, reason. Do not include markdown around "
            "the JSON. The four score fields must be numbers between 0 and 1; "
        )
        judge_input = json.dumps(
            {
                "prompt": prompt,
                "response": response,
            },
            ensure_ascii=False,
        )

        completion = client.chat.completions.create(
            model=judge_model.model_id,
            messages=[
                {
                    "role": "system",
                    "content": judge_instructions,
                },
                {
                    "role": "user",
                    "content": judge_input,
                },
            ],
            temperature=0,
            max_tokens=256,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Gemini judge returned an empty response.")

        scores = JudgeScores.model_validate_json(content)
        dimensions = scores.model_dump(
            exclude={"reason"},
        )
        quality_score = (
            dimensions["correctness"] * self.WEIGHT_CORRECTNESS
            + dimensions["relevance"] * self.WEIGHT_RELEVANCE
            + dimensions["completeness"] * self.WEIGHT_COMPLETENESS
            + dimensions["instruction_following"]
            * self.WEIGHT_INSTRUCTION_FOLLOWING
        )
        quality_score = round(quality_score, 4)

        return {
            "quality_score": quality_score,
            "verification_status": (
                "passed"
                if quality_score >= self.PASS_THRESHOLD
                else "failed"
            ),
            "reason": scores.reason,
            "verification_method": "llm",
            "dimensions": dimensions,
        }

    def verify(
        self,
        prompt: str,
        response: str,
    ) -> dict:
        try:
            return self.verify_with_llm(
                prompt=prompt,
                response=response,
            )
        except Exception as exc:
            heuristic_result = self.verify_with_heuristic(
                prompt=prompt,
                response=response,
            )
            heuristic_result["reason"] = (
                "LLM judge unavailable "
                f"({type(exc).__name__}); heuristic fallback used. "
                f"{heuristic_result['reason']}"
            )
            return heuristic_result

    def evaluate(
        self,
        prompt: str,
        response: str,
    ) -> dict:
        return self.verify(
            prompt=prompt,
            response=response,
        )

    def _calculate_correctness(
        self, prompt: str, response: str
    ) -> tuple[float, list[str]]:
        reasons: list[str] = []
        score = 1.0
        response_lower = response.lower().strip()

        # Check for explicit failure / error indicators
        has_failure_phrase = any(
            phrase in response_lower for phrase in self.FAILURE_PHRASES
        )

        if has_failure_phrase:
            # If the response is primarily an error message
            if len(response_lower.split()) <= 10 or response_lower.startswith("error"):
                score = 0.0
                reasons.append("Response contains explicit failure/error message")
            else:
                score -= 0.50
                reasons.append("Response contains potential failure disclaimer")

        # Repetition / degenerative looping check (e.g. same sentence 4+ times)
        sentences = [s.strip() for s in re.split(r"[.!?\n]", response_lower) if len(s.strip()) > 10]
        if len(sentences) >= 4:
            for s in set(sentences):
                if sentences.count(s) >= 4:
                    score -= 0.40
                    reasons.append("Degenerative repetitive text pattern detected")
                    break

        return max(0.0, min(1.0, score)), reasons

    def _calculate_relevance(
        self, prompt: str, response: str
    ) -> tuple[float, list[str]]:
        reasons: list[str] = []
        prompt_words = self._extract_meaningful_terms(prompt)
        response_words = self._extract_meaningful_terms(response)

        if not prompt_words:
            return 1.0, reasons

        # Count direct or substring/stem matches
        matched = 0
        for pw in prompt_words:
            if pw in response_words:
                matched += 1
            elif any(pw in rw or rw in pw for rw in response_words if len(rw) >= 4 and len(pw) >= 4):
                matched += 1

        overlap = matched / len(prompt_words)

        if overlap >= 0.40:
            score = 1.0
        elif overlap >= 0.25:
            score = 0.85
        elif overlap >= 0.10:
            score = 0.60
            reasons.append("Moderate keyword overlap with prompt")
        elif overlap > 0.0:
            score = 0.35
            reasons.append("Low topical keyword overlap with prompt")
        else:
            score = 0.10
            reasons.append("No meaningful prompt terms identified in response")

        return max(0.0, min(1.0, score)), reasons

    def _calculate_completeness(
        self, prompt: str, response: str
    ) -> tuple[float, list[str]]:
        reasons: list[str] = []
        score = 1.0
        words = response.split()
        prompt_lower = prompt.lower()

        # Extremely short responses
        if len(words) < 3:
            score = 0.20
            reasons.append("Response is excessively brief")
            return score, reasons

        # Task-specific completeness expectations
        is_complex_request = any(
            kw in prompt_lower
            for kw in [
                "explain", "compare", "design", "architecture", "steps",
                "pipeline", "analyze", "evaluate", "roadmap", "strategy",
            ]
        )

        if is_complex_request and len(words) < 12:
            score -= 0.50
            reasons.append("Response appears truncated for an analytical/explanatory request")
        elif len(words) < 5 and not any(kw in prompt_lower for kw in ["what is", "who", "define"]):
            score -= 0.30
            reasons.append("Response length is on the boundary of acceptable depth")

        # Incomplete markdown code block
        if response.count("```") % 2 != 0:
            score -= 0.20
            reasons.append("Unclosed code block detected")

        return max(0.0, min(1.0, score)), reasons

    def _calculate_instruction_following(
        self, prompt: str, response: str
    ) -> tuple[float, list[str]]:
        reasons: list[str] = []
        prompt_lower = prompt.lower()
        response_lower = response.lower().strip()
        score = 1.0

        # If the response is a blatant failure/error, the user's instructions were not executed
        has_failure_phrase = any(
            phrase in response_lower for phrase in self.FAILURE_PHRASES
        )
        if has_failure_phrase and (len(response_lower.split()) <= 10 or response_lower.startswith("error")):
            score = 0.0
            reasons.append("Requested task was aborted with an error message")
            return score, reasons

        format_checked = False

        # 1. JSON requirement
        if "json" in prompt_lower:
            format_checked = True
            if self._is_valid_json_payload(response):
                score = 1.0
            else:
                score = 0.20
                reasons.append("Requested JSON format was not detected or invalid")

        # 2. Table requirement
        elif "table" in prompt_lower:
            format_checked = True
            lines = [line.strip() for line in response.split("\n") if line.strip()]
            table_lines = [line for line in lines if line.startswith("|") and line.endswith("|")]
            if len(table_lines) >= 2 or "|---" in response:
                score = 1.0
            else:
                score = 0.25
                reasons.append("Requested table format was not detected")

        # 3. Bullet points requirement
        elif "bullet" in prompt_lower:
            format_checked = True
            has_bullets = bool(re.search(r"(^|\n)\s*[-*•]\s+", response))
            if has_bullets:
                score = 1.0
            else:
                score = 0.35
                reasons.append("Requested bulleted format was not detected")

        # 4. Numbered steps requirement
        elif "numbered" in prompt_lower or "step by step" in prompt_lower:
            format_checked = True
            has_steps = bool(re.search(r"(^|\n)\s*(step\s*\d+|\d+[\.\)])\s+", response, re.I))
            if has_steps:
                score = 1.0
            else:
                score = 0.40
                reasons.append("Requested step-by-step format was not detected")

        # 5. Code requirement
        elif any(kw in prompt_lower for kw in ["write code", "function that", "script to"]):
            format_checked = True
            has_code_markers = "```" in response or any(
                kw in response for kw in ["def ", "class ", "return ", "import ", "const ", "function "]
            )
            if has_code_markers:
                score = 1.0
            else:
                score = 0.40
                reasons.append("Requested code implementation was not detected")

        if not format_checked:
            score = 1.0

        return max(0.0, min(1.0, score)), reasons

    def _extract_meaningful_terms(self, text: str) -> set[str]:
        words = re.findall(r"\b[a-zA-Z0-9_-]+\b", text.lower())
        return {
            w for w in words
            if len(w) > 2 and w not in self.STOP_WORDS
        }

    @staticmethod
    def _is_valid_json_payload(text: str) -> bool:
        trimmed = text.strip()
        # Direct JSON string
        try:
            json.loads(trimmed)
            return True
        except Exception:
            pass

        # Markdown wrapped JSON
        json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```", text, re.I)
        if json_match:
            try:
                json.loads(json_match.group(1))
                return True
            except Exception:
                pass

        # Standalone JSON object or array in text
        bracket_match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
        if bracket_match:
            try:
                json.loads(bracket_match.group(1))
                return True
            except Exception:
                pass

        return False


quality_service = QualityService()
quality_service = QualityService()