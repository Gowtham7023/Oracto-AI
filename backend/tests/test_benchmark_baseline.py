import pytest
from app.core.model_registry import ModelConfig, get_benchmark_model
from app.services.cost_service import cost_service
from tests.test_api import fake_result, install_completion_mocks, install_fake_provider


def test_1_ollama_simple_request(client, monkeypatch):
    install_completion_mocks(monkeypatch, "simple")
    install_fake_provider(
        monkeypatch,
        [fake_result("ollama", "llama3.2:3b")],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?"},
    )

    assert response.status_code == 200
    body = response.json()
    actual_cost = body["actual_cost"]
    baseline_cost = body["baseline_cost"]
    savings = baseline_cost - actual_cost

    assert actual_cost == 0.0
    assert baseline_cost > 0.0
    assert savings > 0.0


def test_2_gemini_moderate_request(client, monkeypatch):
    install_completion_mocks(monkeypatch, "moderate")
    install_fake_provider(
        monkeypatch,
        [fake_result("gemini", "gemini-3.8-flash")],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "Compare Python and Java."},
    )

    assert response.status_code == 200
    body = response.json()
    actual_cost = body["actual_cost"]
    baseline_cost = body["baseline_cost"]

    # Gemini rates: (20/1000 * 0.00075) + (10/1000 * 0.00375) = 0.000015 + 0.0000375 = 0.0000525
    expected_gemini_cost = 0.0000525
    # Claude benchmark rates: (20/1000 * 0.003) + (10/1000 * 0.015) = 0.00006 + 0.00015 = 0.00021
    expected_claude_benchmark_cost = 0.00021

    assert actual_cost == expected_gemini_cost
    assert baseline_cost == expected_claude_benchmark_cost
    assert baseline_cost != actual_cost


def test_3_claude_complex_request(client, monkeypatch):
    install_completion_mocks(monkeypatch, "complex")
    install_fake_provider(
        monkeypatch,
        [fake_result("claude", "claude-sonnet-4-6")],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "Design a high throughput distributed queue."},
    )

    assert response.status_code == 200
    body = response.json()
    actual_cost = body["actual_cost"]
    baseline_cost = body["baseline_cost"]
    money_saved = baseline_cost - actual_cost
    savings_pct = (money_saved / baseline_cost) * 100 if baseline_cost > 0 else 0.0

    assert pytest.approx(actual_cost, rel=1e-5) == baseline_cost
    assert pytest.approx(savings_pct, abs=1e-3) == 0.0


def test_4_ollama_to_gemini_fallback(client, monkeypatch):
    install_completion_mocks(monkeypatch, "simple")
    install_fake_provider(
        monkeypatch,
        [
            RuntimeError("Ollama connection failed"),
            fake_result("gemini", "gemini-3.8-flash"),
        ],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "What is fast-API?"},
    )

    assert response.status_code == 200
    body = response.json()
    actual_cost = body["actual_cost"]
    baseline_cost = body["baseline_cost"]
    savings = baseline_cost - actual_cost

    expected_gemini_cost = 0.0000525
    expected_claude_benchmark_cost = 0.00021

    assert actual_cost == expected_gemini_cost
    assert baseline_cost == expected_claude_benchmark_cost
    assert savings > 0.0


def test_5_benchmark_configuration_validation(monkeypatch):
    # 1. Exactly one benchmark
    benchmark = get_benchmark_model()
    assert benchmark.provider == "claude"
    assert benchmark.is_benchmark is True

    # 2. No benchmark model
    no_benchmarks = [
        ModelConfig(
            provider="ollama",
            model_id="llama3.2:3b",
            quality_tier=1,
            input_cost_per_1k_tokens=0.0,
            output_cost_per_1k_tokens=0.0,
            average_latency_ms=0,
            is_benchmark=False,
        )
    ]
    monkeypatch.setattr(
        "app.core.model_registry.load_models",
        lambda: no_benchmarks,
    )
    with pytest.raises(ValueError, match="No benchmark model configured"):
        get_benchmark_model()

    # 3. Multiple benchmark models
    multiple_benchmarks = [
        ModelConfig(
            provider="m1",
            model_id="m1-id",
            quality_tier=1,
            input_cost_per_1k_tokens=0.0,
            output_cost_per_1k_tokens=0.0,
            average_latency_ms=0,
            is_benchmark=True,
        ),
        ModelConfig(
            provider="m2",
            model_id="m2-id",
            quality_tier=2,
            input_cost_per_1k_tokens=0.0,
            output_cost_per_1k_tokens=0.0,
            average_latency_ms=0,
            is_benchmark=True,
        ),
    ]
    monkeypatch.setattr(
        "app.core.model_registry.load_models",
        lambda: multiple_benchmarks,
    )
    with pytest.raises(ValueError, match="Multiple benchmark models configured"):
        get_benchmark_model()
