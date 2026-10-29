import time
from app.services.complexity_service import complexity_service
from app.services.generation_settings_service import generation_settings_service


def test_validation_scenario_1_simple():
    # TEST 1:
    # Prompt: What is Python?
    # Generation mode: automatic
    # Expected: complexity = simple, temperature = 0.20, max_tokens = 128
    prompt = "What is Python?"
    complexity_res = complexity_service.analyze(prompt)
    complexity = complexity_res["complexity"]
    settings = generation_settings_service.resolve_generation_settings(
        complexity=complexity,
        generation_mode="automatic",
    )

    assert complexity == "simple"
    assert settings["mode"] == "automatic"
    assert settings["temperature"] == 0.20
    assert settings["max_tokens"] == 128


def test_validation_scenario_2_moderate():
    # TEST 2:
    # Prompt: Compare Python and Java in a detailed table including performance, syntax, memory management, use cases, and learning curve.
    # Generation mode: automatic
    # Expected: complexity = moderate, temperature = 0.20, max_tokens = 2048
    prompt = "Compare Python and Java in a detailed table including performance, syntax, memory management, use cases, and learning curve."
    complexity_res = complexity_service.analyze(prompt)
    complexity = complexity_res["complexity"]
    settings = generation_settings_service.resolve_generation_settings(
        complexity=complexity,
        generation_mode="automatic",
    )

    assert complexity == "moderate"
    assert settings["mode"] == "automatic"
    assert settings["temperature"] == 0.20
    assert settings["max_tokens"] == 2048


def test_validation_scenario_3_complex():
    # TEST 3:
    # Prompt: Design a scalable banking transaction architecture with security, database consistency, failure handling, monitoring, fraud detection, and high availability.
    # Generation mode: automatic
    # Expected: complexity = complex, temperature = 0.15, max_tokens = 4096
    prompt = "Design a scalable banking transaction architecture with security, database consistency, failure handling, monitoring, fraud detection, and high availability."
    complexity_res = complexity_service.analyze(prompt)
    complexity = complexity_res["complexity"]
    settings = generation_settings_service.resolve_generation_settings(
        complexity=complexity,
        generation_mode="automatic",
    )

    assert complexity == "complex"
    assert settings["mode"] == "automatic"
    assert settings["temperature"] == 0.15
    assert settings["max_tokens"] == 4096


def test_validation_scenario_4_manual():
    # TEST 4:
    # Manual mode: temperature = 0.5, max_tokens = 1024
    # Expected response metadata: mode = manual, temperature = 0.5, max_tokens = 1024
    settings = generation_settings_service.resolve_generation_settings(
        complexity="simple",
        generation_mode="manual",
        manual_temperature=0.5,
        manual_max_tokens=1024,
    )

    assert settings["mode"] == "manual"
    assert settings["temperature"] == 0.5
    assert settings["max_tokens"] == 1024


def test_validation_scenarios_through_api(client, monkeypatch):
    provider_calls = []

    def fake_generate(**kwargs):
        provider_calls.append(kwargs)
        kwargs["on_request_start"]()
        return {
            "provider": kwargs["provider"],
            "model": kwargs["model"],
            "output": "Simulated output for test.",
            "input_tokens": 15,
            "output_tokens": 25,
            "_response_received_at": time.perf_counter() + 0.01,
        }

    monkeypatch.setattr("app.api.routes.provider_service.generate", fake_generate)
    monkeypatch.setattr(
        "app.api.routes.quality_service.verify",
        lambda **kwargs: {
            "quality_score": 0.95,
            "verification_status": "passed",
            "verification_method": "heuristic",
            "reason": "Test verification.",
            "dimensions": {
                "correctness": 0.95,
                "relevance": 0.95,
                "completeness": 0.95,
                "instruction_following": 0.95,
            },
        },
    )

    # API Test 1: Simple
    r1 = client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?", "generation_mode": "automatic"},
    )
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["complexity"] == "simple"
    assert d1["generation_settings"] == {
        "mode": "automatic",
        "temperature": 0.20,
        "max_tokens": 128,
    }
    assert provider_calls[-1]["temperature"] == 0.20
    assert provider_calls[-1]["max_tokens"] == 128

    # API Test 2: Moderate
    r2 = client.post(
        "/api/v1/completions",
        json={
            "prompt": "Compare Python and Java in a detailed table including performance, syntax, memory management, use cases, and learning curve.",
            "generation_mode": "automatic",
        },
    )
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["complexity"] == "moderate"
    assert d2["generation_settings"] == {
        "mode": "automatic",
        "temperature": 0.20,
        "max_tokens": 2048,
    }
    assert provider_calls[-1]["temperature"] == 0.20
    assert provider_calls[-1]["max_tokens"] == 2048

    # API Test 3: Complex
    r3 = client.post(
        "/api/v1/completions",
        json={
            "prompt": "Design a scalable banking transaction architecture with security, database consistency, failure handling, monitoring, fraud detection, and high availability.",
            "generation_mode": "automatic",
        },
    )
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["complexity"] == "complex"
    assert d3["generation_settings"] == {
        "mode": "automatic",
        "temperature": 0.15,
        "max_tokens": 4096,
    }
    assert provider_calls[-1]["temperature"] == 0.15
    assert provider_calls[-1]["max_tokens"] == 4096

    # API Test 4: Manual
    r4 = client.post(
        "/api/v1/completions",
        json={
            "prompt": "Custom manual configuration test",
            "generation_mode": "manual",
            "temperature": 0.5,
            "max_tokens": 1024,
        },
    )
    assert r4.status_code == 200
    d4 = r4.json()
    assert d4["generation_settings"] == {
        "mode": "manual",
        "temperature": 0.5,
        "max_tokens": 1024,
    }
    assert provider_calls[-1]["temperature"] == 0.5
    assert provider_calls[-1]["max_tokens"] == 1024
