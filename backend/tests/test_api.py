import time

QUALITY_PASS = {
    "quality_score": 0.9,
    "verification_status": "passed",
    "verification_method": "heuristic",
    "reason": "Test verification.",
    "dimensions": {
        "correctness": 0.9,
        "relevance": 0.9,
        "completeness": 0.9,
        "instruction_following": 0.9,
    },
}

QUALITY_FAIL = {
    **QUALITY_PASS,
    "quality_score": 0.3,
    "verification_status": "failed",
}


def install_completion_mocks(monkeypatch, complexity, qualities=None):
    monkeypatch.setattr(
        "app.api.routes.complexity_service.analyze",
        lambda prompt: {"complexity": complexity, "confidence": 0.9},
    )
    quality_values = iter(qualities or [QUALITY_PASS])
    monkeypatch.setattr(
        "app.api.routes.quality_service.verify",
        lambda **kwargs: next(quality_values),
    )


def fake_result(provider, model, output="Test response"):
    return {
        "provider": provider,
        "model": model,
        "output": output,
        "input_tokens": 20,
        "output_tokens": 10,
        "_response_received_at": 0.0,
    }


def install_fake_provider(monkeypatch, results):
    results = iter(results)
    calls = []

    def generate(**kwargs):
        calls.append((kwargs["provider"], kwargs["model"]))
        kwargs["on_request_start"]()
        result = next(results)
        if isinstance(result, Exception):
            raise result
        result["_response_received_at"] = time.perf_counter() + 0.02
        return result

    monkeypatch.setattr("app.api.routes.provider_service.generate", generate)
    return calls


def test_simple_completion_api(client, monkeypatch):
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
    assert body["request_id"]
    assert body["output"]
    assert body["complexity"] == "simple"
    assert body["provider"] == "ollama"
    assert body["model"]
    assert body["quality"]["quality_score"] == 0.9
    assert body["latency_ms"] >= 0
    assert body["routing"]["fallback_used"] is False

    details = client.get(
        f"/api/v1/requests/{body['request_id']}",
    )
    assert details.status_code == 200
    record = details.json()
    assert record["request_id"] == body["request_id"]
    assert record["baseline_cost"] == body["baseline_cost"]
    assert record["actual_cost"] == body["actual_cost"]
    assert record["verification_method"] == "heuristic"
    assert record["fallback_used"] is False
    assert record["quality_escalated"] is False
    assert record["initial_model"]
    assert record["final_model"] == body["model"]

    requests = client.get("/api/v1/requests")
    assert requests.status_code == 200
    assert requests.json()[0]["request_id"] == body["request_id"]


def test_invalid_completion_request(client):
    assert client.post(
        "/api/v1/completions",
        json={"prompt": ""},
    ).status_code == 422
    assert client.post(
        "/api/v1/completions",
        json={"temperature": "invalid"},
    ).status_code == 422


def test_routing_config_api(client):
    initial = client.get("/api/v1/routing-config")
    assert initial.status_code == 200
    assert initial.json()["simple_min_tier"] == 1

    updated = client.put(
        "/api/v1/routing-config",
        json={
            "simple_min_tier": 1,
            "moderate_min_tier": 2,
            "complex_min_tier": 3,
            "quality_threshold": 0.8,
            "enable_escalation": True,
        },
    )
    assert updated.status_code == 200
    assert client.get("/api/v1/routing-config").json()[
        "quality_threshold"
    ] == 0.8

    for invalid in (
        {"quality_threshold": 1.1},
        {"quality_threshold": -0.1},
        {"simple_min_tier": 3, "moderate_min_tier": 2},
    ):
        assert client.put(
            "/api/v1/routing-config",
            json=invalid,
        ).status_code == 422


def test_provider_failure_uses_eligible_fallback(client, monkeypatch):
    install_completion_mocks(monkeypatch, "moderate")
    attempts = install_fake_provider(
        monkeypatch,
        [
            RuntimeError("private failure details"),
            fake_result("claude", "claude-sonnet-4-6"),
        ],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "Compare Python and Java."},
    )

    assert response.status_code == 200
    body = response.json()
    assert attempts == [
        ("gemini", "gemini-3.8-flash"),
        ("claude", "claude-sonnet-4-6"),
    ]
    assert body["routing"]["fallback_used"] is True
    assert body["routing"]["final_provider"] == "claude"
    assert "private failure details" not in response.text


def test_provider_failure_does_not_downgrade_complex(client, monkeypatch):
    install_completion_mocks(monkeypatch, "complex")
    attempts = install_fake_provider(
        monkeypatch,
        [RuntimeError("unavailable")],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "Design a complex system."},
    )

    assert response.status_code == 503
    assert attempts == [("claude", "claude-sonnet-4-6")]
    detail = response.json()["detail"]
    assert detail["required_tier"] == 3
    assert all(
        item["quality_tier"] >= 3
        for item in detail["attempted_models"]
    )


def test_all_eligible_provider_failures_return_503(client, monkeypatch):
    install_completion_mocks(monkeypatch, "moderate")
    attempts = install_fake_provider(
        monkeypatch,
        [
            RuntimeError("Gemini unavailable"),
            RuntimeError("Claude unavailable"),
        ],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "Compare Python and Java."},
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail["required_tier"] == 2
    assert attempts == [
        ("gemini", "gemini-3.8-flash"),
        ("claude", "claude-sonnet-4-6"),
    ]
    assert [item["status"] for item in detail["attempted_models"]] == [
        "failed",
        "failed",
    ]
    assert "unavailable" not in response.text
    assert all(item["error_message"] == "RuntimeError" for item in detail["attempted_models"])


def test_unavailable_providers_are_explained_without_tier_downgrade(
    client,
    monkeypatch,
):
    install_completion_mocks(monkeypatch, "complex")
    monkeypatch.setattr(
        "app.services.router_service.provider_service.check_availability",
        lambda provider, model: (False, f"{provider} is unavailable."),
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "Design a complex system."},
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail["required_tier"] == 3
    assert "claude/claude-sonnet-4-6" in detail["message"]
    assert "claude is unavailable" in detail["message"]
    assert [item["provider"] for item in detail["attempted_models"]] == ["claude"]


def test_llm_judge_failure_falls_back_without_failing_completion(
    client,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.api.routes.complexity_service.analyze",
        lambda prompt: {"complexity": "simple", "confidence": 0.9},
    )
    monkeypatch.setattr(
        "app.api.routes.quality_service.verify_with_llm",
        lambda **kwargs: (_ for _ in ()).throw(
            RuntimeError("judge unavailable")
        ),
    )
    install_fake_provider(
        monkeypatch,
        [
            fake_result(
                "ollama",
                "llama3.2:3b",
                output="Python is a programming language.",
            )
        ],
    )

    response = client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["quality"]["verification_method"] == "heuristic"
    assert "heuristic fallback used" in body["quality"]["reason"]


def test_quality_escalation_and_disabled_config(client, monkeypatch):
    install_completion_mocks(
        monkeypatch,
        "simple",
        [QUALITY_FAIL, QUALITY_PASS],
    )
    attempts = install_fake_provider(
        monkeypatch,
        [
            fake_result("ollama", "llama3.2:3b", output="Initial"),
            fake_result("gemini", "gemini-3.8-flash", output="Better"),
        ],
    )

    escalated = client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?"},
    ).json()
    assert escalated["routing"]["quality_escalated"] is True
    assert escalated["routing"]["initial_quality_score"] == 0.3
    assert escalated["routing"]["final_quality_score"] == 0.9
    assert escalated["output"] == "Better"

    client.put(
        "/api/v1/routing-config",
        json={"enable_escalation": False},
    )
    install_completion_mocks(monkeypatch, "simple", [QUALITY_FAIL])
    attempts_disabled = install_fake_provider(
        monkeypatch,
        [fake_result("ollama", "llama3.2:3b", output="Original")],
    )
    not_escalated = client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?"},
    ).json()
    assert not_escalated["routing"]["quality_escalated"] is False
    assert not_escalated["output"] == "Original"
    assert attempts_disabled == [("ollama", "llama3.2:3b")]


def test_analytics_endpoints(client, monkeypatch):
    install_completion_mocks(monkeypatch, "simple")
    install_fake_provider(
        monkeypatch,
        [fake_result("ollama", "llama3.2:3b")],
    )
    assert client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?"},
    ).status_code == 200

    stats = client.get("/api/v1/stats")
    assert stats.status_code == 200
    assert {"total_requests", "total_actual_cost", "average_latency_ms"} <= (
        stats.json().keys()
    )

    endpoints = (
        ("/api/v1/analytics/cost", list),
        ("/api/v1/analytics/routing", list),
        ("/api/v1/analytics/quality", list),
        ("/api/v1/analytics/escalation", dict),
    )
    for path, expected_type in endpoints:
        response = client.get(path)
        assert response.status_code == 200
        assert isinstance(response.json(), expected_type)

    escalation = client.get("/api/v1/analytics/escalation").json()
    assert {
        "total_requests",
        "escalated_requests",
        "non_escalated_requests",
        "escalation_rate",
    } <= escalation.keys()


def test_models_api(client):
    response = client.get("/api/v1/models")

    assert response.status_code == 200
    models = response.json()
    assert models
    assert all("quality_tier" in item for item in models)


def test_automatic_generation_settings_completions(client, monkeypatch):
    install_completion_mocks(monkeypatch, "simple")
    provider_calls = []

    def fake_generate(**kwargs):
        provider_calls.append(kwargs)
        kwargs["on_request_start"]()
        res = fake_result(kwargs["provider"], kwargs["model"])
        res["_response_received_at"] = time.perf_counter() + 0.01
        return res

    monkeypatch.setattr("app.api.routes.provider_service.generate", fake_generate)

    # 1. Simple automatic
    res_simple = client.post(
        "/api/v1/completions",
        json={"prompt": "What is Python?", "generation_mode": "automatic"},
    )
    assert res_simple.status_code == 200
    data_simple = res_simple.json()
    assert data_simple["complexity"] == "simple"
    assert data_simple["generation_settings"] == {
        "mode": "automatic",
        "temperature": 0.20,
        "max_tokens": 128,
    }
    assert provider_calls[-1]["temperature"] == 0.20
    assert provider_calls[-1]["max_tokens"] == 128

    # 2. Moderate automatic
    install_completion_mocks(monkeypatch, "moderate")
    res_mod = client.post(
        "/api/v1/completions",
        json={"prompt": "Compare Python and Java.", "generation_mode": "automatic"},
    )
    assert res_mod.status_code == 200
    data_mod = res_mod.json()
    assert data_mod["complexity"] == "moderate"
    assert data_mod["generation_settings"] == {
        "mode": "automatic",
        "temperature": 0.20,
        "max_tokens": 2048,
    }
    assert provider_calls[-1]["temperature"] == 0.20
    assert provider_calls[-1]["max_tokens"] == 2048

    # 3. Complex automatic
    install_completion_mocks(monkeypatch, "complex")
    res_complex = client.post(
        "/api/v1/completions",
        json={"prompt": "Design a banking architecture.", "generation_mode": "automatic"},
    )
    assert res_complex.status_code == 200
    data_complex = res_complex.json()
    assert data_complex["complexity"] == "complex"
    assert data_complex["generation_settings"] == {
        "mode": "automatic",
        "temperature": 0.15,
        "max_tokens": 4096,
    }
    assert provider_calls[-1]["temperature"] == 0.15
    assert provider_calls[-1]["max_tokens"] == 4096


def test_manual_generation_settings_override(client, monkeypatch):
    install_completion_mocks(monkeypatch, "simple")
    provider_calls = []

    def fake_generate(**kwargs):
        provider_calls.append(kwargs)
        kwargs["on_request_start"]()
        res = fake_result(kwargs["provider"], kwargs["model"])
        res["_response_received_at"] = time.perf_counter() + 0.01
        return res

    monkeypatch.setattr("app.api.routes.provider_service.generate", fake_generate)

    response = client.post(
        "/api/v1/completions",
        json={
            "prompt": "Test prompt",
            "generation_mode": "manual",
            "temperature": 0.5,
            "max_tokens": 1024,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["generation_settings"] == {
        "mode": "manual",
        "temperature": 0.5,
        "max_tokens": 1024,
    }
    assert provider_calls[-1]["temperature"] == 0.5
    assert provider_calls[-1]["max_tokens"] == 1024
