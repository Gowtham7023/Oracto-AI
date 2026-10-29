from app.core.model_registry import ModelConfig
from app.schemas.routing_config_schema import RoutingConfigUpdate
from app.services.escalation_service import escalation_service
from app.services.router_service import router_service


def model(tier: int) -> ModelConfig:
    return ModelConfig(
        provider=f"provider-{tier}",
        model_id=f"model-{tier}",
        quality_tier=tier,
        input_cost_per_1k_tokens=0.0,
        output_cost_per_1k_tokens=0.0,
        average_latency_ms=0,
    )


def test_score_at_threshold_does_not_escalate():
    assert not escalation_service.should_escalate(
        quality_score=0.70,
        quality_threshold=0.70,
        enable_escalation=True,
    )


def test_low_score_escalates_when_higher_tier_exists():
    decision = escalation_service.get_escalation_decision(
        quality_score=0.2,
        current_model=model(2),
    )

    assert decision["should_escalate"]
    assert decision["escalation_quality_tier"] > 2


def test_tier_three_has_no_higher_escalation():
    decision = escalation_service.get_escalation_decision(
        quality_score=0.1,
        current_model=model(3),
    )

    assert not decision["should_escalate"]
    assert decision["escalation_model"] is None


def test_disabled_escalation_is_respected():
    router_service.update_routing_config(
        RoutingConfigUpdate.model_validate(
            {"enable_escalation": False}
        )
    )

    decision = escalation_service.get_escalation_decision(
        quality_score=0.1,
        current_model=model(1),
    )

    assert not decision["should_escalate"]

