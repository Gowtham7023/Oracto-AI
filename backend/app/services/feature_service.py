import re


class FeatureService:

    def extract_features(self, prompt: str) -> dict:
        words = prompt.split()

        return {
            "word_count": len(words),
            "character_count": len(prompt),
            "sentence_count": len(re.findall(r"[.!?]", prompt)),
            "question_mark_count": prompt.count("?"),
            "exclamation_count": prompt.count("!"),
            "newline_count": prompt.count("\n"),
            "number_count": len(re.findall(r"\d+", prompt)),
            "bullet_count": len(
                re.findall(r"(^|\n)\s*[-*•]\s+", prompt)
            ),
            "code_indicator": self._contains_code_indicator(prompt),
            "context_indicator": self._contains_context_indicator(prompt),
            "output_format_indicator": self._contains_output_format(prompt),
            "reasoning_keyword_count": self._count_keywords(
                prompt,
                [
                    "explain",
                    "reason",
                    "derive",
                    "solve",
                    "why",
                    "how",
                ],
            ),
            "comparison_keyword_count": self._count_keywords(
                prompt,
                [
                    "compare",
                    "difference",
                    "versus",
                    "vs",
                    "better",
                ],
            ),
            "analysis_keyword_count": self._count_keywords(
                prompt,
                [
                    "analyze",
                    "analysis",
                    "evaluate",
                    "assess",
                    "review",
                ],
            ),
            "constraint_keyword_count": self._count_keywords(
                prompt,
                [
                    "must",
                    "should",
                    "only",
                    "exactly",
                    "without",
                    "under",
                ],
            ),
            "instruction_count": self._count_keywords(
                prompt,
                [
                    "create",
                    "write",
                    "generate",
                    "provide",
                    "list",
                    "design",
                ],
            ),
            "question_count": len(
                re.findall(r"\b(what|why|how|when|where|which|who)\b", prompt.lower())
            ),
        }

    @staticmethod
    def _count_keywords(prompt: str, keywords: list[str]) -> int:
        prompt_lower = prompt.lower()

        return sum(
            len(re.findall(rf"\b{re.escape(keyword)}\b", prompt_lower))
            for keyword in keywords
        )

    @staticmethod
    def _contains_code_indicator(prompt: str) -> int:
        indicators = [
            "```",
            "python",
            "java",
            "javascript",
            "typescript",
            "code",
            "function",
            "class ",
            "api",
        ]

        prompt_lower = prompt.lower()

        return int(any(indicator in prompt_lower for indicator in indicators))

    @staticmethod
    def _contains_context_indicator(prompt: str) -> int:
        indicators = [
            "context",
            "background",
            "given that",
            "based on",
            "consider",
            "scenario",
        ]

        prompt_lower = prompt.lower()

        return int(any(indicator in prompt_lower for indicator in indicators))

    @staticmethod
    def _contains_output_format(prompt: str) -> int:
        indicators = [
            "json",
            "table",
            "bullet points",
            "bullets",
            "steps",
            "format",
            "markdown",
        ]

        prompt_lower = prompt.lower()

        return int(any(indicator in prompt_lower for indicator in indicators))


feature_service = FeatureService()