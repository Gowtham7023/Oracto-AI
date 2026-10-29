import pytest

from app.services.complexity_service import ComplexityService
from app.services.feature_service import FeatureService


@pytest.mark.parametrize(
    "prompt",
    [
        "What is Python?",
        "Compare Python and Java and explain the main differences.",
        (
            "Design a scalable banking transaction architecture with security, "
            "database consistency, failure handling, and monitoring."
        ),
    ],
)
def test_feature_structure_is_numeric(prompt):
    features = FeatureService().extract_features(prompt)

    assert set(features) == set(ComplexityService.FEATURE_NAMES)
    assert all(
        isinstance(value, (int, float))
        for value in features.values()
    )


@pytest.mark.parametrize("prompt", ["", "Hi", "What?"])
def test_short_prompts_are_supported(prompt):
    features = FeatureService().extract_features(prompt)

    assert features["word_count"] == len(prompt.split())
    assert features["character_count"] == len(prompt)


def test_multiline_code_like_prompt():
    prompt = "Write Python code:\n```python\ndef answer():\n    return 42\n```"
    features = FeatureService().extract_features(prompt)

    assert features["newline_count"] == 4
    assert features["code_indicator"] == 1
    assert features["instruction_count"] == 1
