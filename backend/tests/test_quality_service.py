import json
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from app.services.quality_service import QualityService


@pytest.mark.parametrize(
    ("prompt", "response"),
    [
        ("What is Python?", "Python is a programming language."),
        (
            "Compare Python and Java in a table.",
            "| Language | Type |\n|---|---|\n| Python | General purpose |\n| Java | General purpose |",
        ),
        (
            "Give exactly 3 advantages of Python.",
            "1. Clear syntax\n2. A broad ecosystem\n3. Cross-platform support",
        ),
        ("Explain this.", ""),
        ("Run this task.", "Error: unable to generate a response."),
    ],
)
def test_heuristic_verification_contract(prompt, response):
    result = QualityService().verify_with_heuristic(prompt, response)

    assert 0 <= result["quality_score"] <= 1
    assert result["verification_status"] in {"passed", "failed"}
    assert result["verification_method"] == "heuristic"
    assert set(result["dimensions"]) == {
        "correctness",
        "relevance",
        "completeness",
        "instruction_following",
    }


def test_mocked_llm_judge_scores_and_passes(monkeypatch):
    scores = {
        "correctness": 0.9,
        "relevance": 0.8,
        "completeness": 0.85,
        "instruction_following": 0.75,
        "reason": "Relevant and sufficiently complete.",
    }
    completion = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content=json.dumps(scores))
            )
        ]
    )
    client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=Mock(return_value=completion)
            )
        )
    )
    monkeypatch.setattr(
        "app.services.quality_service.settings.gemini_api_key",
        "test-key",
    )

    with patch(
        "app.services.quality_service.OpenAI",
        return_value=client,
    ) as openai:
        result = QualityService().verify_with_llm(
            "What is Python?",
            "Python is a programming language.",
        )

    assert result["quality_score"] == 0.84
    assert result["verification_status"] == "passed"
    assert result["verification_method"] == "llm"
    assert result["dimensions"]["correctness"] == 0.9
    call = openai.return_value.chat.completions.create.call_args
    assert call.kwargs["model"]
    assert call.kwargs["response_format"] == {"type": "json_object"}


def test_llm_judge_failure_uses_heuristic(monkeypatch):
    service = QualityService()
    monkeypatch.setattr(
        service,
        "verify_with_llm",
        lambda **kwargs: (_ for _ in ()).throw(RuntimeError("unavailable")),
    )

    result = service.verify("What is Python?", "Python is a language.")

    assert result["verification_method"] == "heuristic"
    assert "heuristic fallback used" in result["reason"]
    assert 0 <= result["quality_score"] <= 1
