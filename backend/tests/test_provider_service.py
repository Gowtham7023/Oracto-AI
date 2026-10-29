from unittest.mock import Mock

import requests

from app.services.provider_service import ProviderService


def test_ollama_availability_does_not_require_api_keys(monkeypatch):
    monkeypatch.setattr(
        "app.services.provider_service.settings.gemini_api_key",
        "",
    )
    monkeypatch.setattr(
        "app.services.provider_service.settings.anthropic_api_key",
        "",
    )
    response = Mock()
    response.json.return_value = {
        "models": [{"name": "llama3.2:3b"}],
    }
    monkeypatch.setattr(
        "app.services.provider_service.requests.get",
        lambda *args, **kwargs: response,
    )

    available, reason = ProviderService().check_availability(
        "ollama",
        "llama3.2:3b",
    )

    assert available is True
    assert "model is installed" in reason


def test_ollama_availability_rejects_missing_model(monkeypatch):
    response = Mock()
    response.json.return_value = {"models": []}
    monkeypatch.setattr(
        "app.services.provider_service.requests.get",
        lambda *args, **kwargs: response,
    )

    available, reason = ProviderService().check_availability(
        "ollama",
        "llama3.2:3b",
    )

    assert available is False
    assert "not installed" in reason


def test_provider_aliases_normalize():
    service = ProviderService()

    assert service.normalize_provider("Google") == "gemini"
    assert service.normalize_provider("google-gemini") == "gemini"
    assert service.normalize_provider("Anthropic") == "claude"
    assert service.normalize_provider("ollama") == "ollama"


def test_provider_connection_error_has_actionable_diagnostic():
    message = ProviderService.describe_error(
        requests.ConnectionError("Ollama server is not reachable.")
    )

    assert "Ollama server is not reachable." in message
