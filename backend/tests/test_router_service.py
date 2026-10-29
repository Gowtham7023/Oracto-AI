import pytest

from app.core.model_registry import ModelConfig
from app.services.model_service import model_service
from app.services.router_service import (
    NoEligibleProviderError,
    RouterService,
    router_service,
)


@pytest.mark.parametrize(
    ("complexity", "minimum_tier"),
    [("simple", 1), ("moderate", 2), ("complex", 3)],
)
def test_selected_model_meets_minimum_tier(complexity, minimum_tier):
    decision = router_service.get_routing_decision(complexity, 0.9)
    selected = next(
        model
        for model in model_service.get_enabled_models()
        if model.model_id == decision["selected_model"]
    )

    assert decision["required_tier"] == minimum_tier
    assert selected.quality_tier >= minimum_tier


def test_complex_never_selects_below_tier_three():
    selected = router_service.select_model("complex")

    assert selected.quality_tier >= 3


def test_disabled_models_are_not_selected(monkeypatch):
    disabled = ModelConfig(
        provider="disabled",
        model_id="disabled-tier-1",
        quality_tier=1,
        input_cost_per_1k_tokens=0.0,
        output_cost_per_1k_tokens=0.0,
        average_latency_ms=0,
        enabled=False,
    )
    enabled = ModelConfig(
        provider="enabled",
        model_id="enabled-tier-1",
        quality_tier=1,
        input_cost_per_1k_tokens=1.0,
        output_cost_per_1k_tokens=1.0,
        average_latency_ms=0,
        enabled=True,
    )
    monkeypatch.setattr(model_service, "models", [disabled, enabled])

    assert RouterService().select_model("simple") is enabled


def test_fallbacks_exclude_failed_provider_and_respect_tier():
    moderate_fallbacks = router_service.get_fallback_models(
        "moderate",
        failed_provider="gemini",
    )
    complex_fallbacks = router_service.get_fallback_models(
        "complex",
        failed_provider="claude",
    )

    assert all(model.provider != "gemini" for model in moderate_fallbacks)
    assert all(model.quality_tier >= 2 for model in moderate_fallbacks)
    assert all(model.quality_tier >= 3 for model in complex_fallbacks)
    assert complex_fallbacks == []


def test_simple_routes_to_next_available_tier_eligible_model(monkeypatch):
    monkeypatch.setattr(
        "app.services.router_service.provider_service.check_availability",
        lambda provider, model: (provider != "ollama", "Ollama is unavailable."),
    )

    decision = RouterService().get_routing_decision("simple", 0.9)

    assert decision["required_tier"] == 1
    assert decision["selected_provider"] == "gemini"
    assert all(model.quality_tier >= 1 for model in decision["available_models"])


def test_complex_does_not_downgrade_when_claude_is_unavailable(monkeypatch):
    monkeypatch.setattr(
        "app.services.router_service.provider_service.check_availability",
        lambda provider, model: (False, "Claude API key is not configured."),
    )

    with pytest.raises(NoEligibleProviderError) as error:
        RouterService().get_routing_decision("complex", 0.9)

    assert error.value.required_tier == 3
    assert error.value.checked_models == [
        {
            "provider": "claude",
            "model": "claude-sonnet-4-6",
            "quality_tier": 3,
            "status": "unavailable",
            "error_type": None,
            "error_message": "Claude API key is not configured.",
        }
    ]
