from app.core.model_registry import ModelConfig
from app.services.cost_service import CostService


def test_actual_and_baseline_cost_calculation():
    model = ModelConfig(
        provider="test",
        model_id="test-model",
        quality_tier=1,
        input_cost_per_1k_tokens=0.002,
        output_cost_per_1k_tokens=0.006,
        average_latency_ms=0,
    )
    service = CostService()

    actual_cost = service.calculate_cost(model, 1500, 500)
    baseline_cost = service.calculate_baseline_cost(model, 1500, 500)
    money_saved = baseline_cost - actual_cost
    savings_percentage = (
        money_saved / baseline_cost * 100
        if baseline_cost
        else 0.0
    )

    assert actual_cost == 0.006
    assert baseline_cost == 0.006
    assert money_saved == 0
    assert savings_percentage == 0


def test_negative_savings_are_valid():
    baseline_cost = 0.004
    actual_cost = 0.006

    money_saved = baseline_cost - actual_cost
    savings_percentage = money_saved / baseline_cost * 100

    assert money_saved == -0.002
    assert savings_percentage == -50


def test_zero_baseline_has_no_division_by_zero():
    baseline_cost = 0.0
    actual_cost = 0.01

    savings_percentage = (
        (baseline_cost - actual_cost) / baseline_cost * 100
        if baseline_cost > 0
        else 0.0
    )

    assert savings_percentage == 0.0


def test_get_benchmark_model():
    from app.core.model_registry import get_benchmark_model
    benchmark = get_benchmark_model()
    assert benchmark.is_benchmark is True
    assert benchmark.provider == "claude"
    assert benchmark.model_id == "claude-sonnet-4-6"


def test_calculate_benchmark_cost():
    service = CostService()
    # 1000 input tokens * (0.003 / 1000) + 500 output tokens * (0.015 / 1000) = 0.003 + 0.0075 = 0.0105
    benchmark_cost = service.calculate_benchmark_cost(1000, 500)
    assert benchmark_cost == 0.0105


