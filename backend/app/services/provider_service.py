from collections.abc import Callable
import logging
import time

import requests
from openai import APIError, OpenAI

from app.core.config import settings


logger = logging.getLogger(__name__)


class ProviderService:
    PROVIDER_ALIASES = {
        "ollama": "ollama",
        "gemini": "gemini",
        "google": "gemini",
        "google_gemini": "gemini",
        "claude": "claude",
        "anthropic": "claude",
    }

    @classmethod
    def normalize_provider(cls, provider: str) -> str:
        normalized = provider.strip().lower().replace("-", "_")
        try:
            return cls.PROVIDER_ALIASES[normalized]
        except KeyError as exc:
            raise ValueError(f"Unsupported provider: {provider}") from exc

    def check_availability(
        self,
        provider: str,
        model: str,
    ) -> tuple[bool, str]:
        try:
            normalized_provider = self.normalize_provider(provider)
        except ValueError as exc:
            return False, str(exc)

        if normalized_provider == "ollama":
            try:
                response = requests.get(
                    f"{settings.ollama_base_url.rstrip('/')}/api/tags",
                    timeout=(2.0, 3.0),
                )
                response.raise_for_status()
                models_data = response.json().get("models", [])
                installed_models = set()
                for item in models_data:
                    name = item.get("name", "").lower()
                    m_name = item.get("model", "").lower()
                    if name:
                        installed_models.add(name)
                    if m_name:
                        installed_models.add(m_name)
            except (requests.RequestException, ValueError) as exc:
                return False, f"Ollama unreachable: {self.describe_error(exc)}"

            normalized_model = model.lower()
            is_installed = (
                normalized_model in installed_models
                or f"{normalized_model}:latest" in installed_models
                or any(
                    installed == normalized_model
                    or installed.startswith(f"{normalized_model}:")
                    for installed in installed_models
                )
            )
            if is_installed:
                return True, "Ollama server is reachable and the model is installed."
            return False, f"Ollama is reachable, but model '{model}' is not installed."

        api_key = (
            settings.gemini_api_key
            if normalized_provider == "gemini"
            else settings.anthropic_api_key
        )
        if not api_key.strip():
            return False, f"{normalized_provider} API key is not configured."

        return True, f"{normalized_provider} API key is configured."

    @staticmethod
    def describe_error(error: Exception) -> str:
        if isinstance(error, (requests.RequestException, APIError)):
            message = str(error).strip() or type(error).__name__
        else:
            message = type(error).__name__
        for secret in (settings.gemini_api_key, settings.anthropic_api_key):
            if secret:
                message = message.replace(secret, "[REDACTED]")
        return message[:500]

    def generate(
        self,
        provider: str,
        model: str,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 256,
        on_request_start: Callable[[], None] | None = None,
    ) -> dict:

        normalized_provider = self.normalize_provider(provider)

        if normalized_provider == "ollama":
            result = self._generate_ollama(
                model=model,
                prompt=prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                on_request_start=on_request_start,
            )

        elif normalized_provider == "gemini":
            result = self._generate_gemini(
                model=model,
                prompt=prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                on_request_start=on_request_start,
            )

        elif normalized_provider == "claude":
            result = self._generate_claude(
                model=model,
                prompt=prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                on_request_start=on_request_start,
            )

        result["provider"] = normalized_provider
        result["model"] = model

        return result

    def _generate_ollama(
        self,
        model: str,
        prompt: str,
        temperature: float,
        max_tokens: int,
        on_request_start: Callable[[], None] | None,
    ) -> dict:

        url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        if on_request_start is not None:
            on_request_start()

        start_time = time.perf_counter()
        response = requests.post(
            url,
            json=payload,
            timeout=(10.0, 300.0),
        )
        response_received_at = time.perf_counter()

        response.raise_for_status()

        data = response.json()

        return {
            "output": data.get("response", ""),
            "input_tokens": data.get("prompt_eval_count", 0),
            "output_tokens": data.get("eval_count", 0),
            "total_tokens": (
                data.get("prompt_eval_count", 0)
                + data.get("eval_count", 0)
            ),
            "provider_latency_ms": int(
                (response_received_at - start_time) * 1000
            ),
            "_response_received_at": response_received_at,
        }

    def _generate_gemini(
        self,
        model: str,
        prompt: str,
        temperature: float,
        max_tokens: int,
        on_request_start: Callable[[], None] | None,
    ) -> dict:

        client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url=(
                "https://generativelanguage.googleapis.com/"
                "v1beta/openai/"
            ),
            timeout=30.0,
            max_retries=0,
        )

        messages = [
            {
                "role": "user",
                "content": prompt,
            }
        ]

        if on_request_start is not None:
            on_request_start()

        start_time = time.perf_counter()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        response_received_at = time.perf_counter()

        output = response.choices[0].message.content or ""

        usage = response.usage

        input_tokens = usage.prompt_tokens if usage else 0
        output_tokens = usage.completion_tokens if usage else 0

        return {
            "output": output,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "provider_latency_ms": int(
                (response_received_at - start_time) * 1000
            ),
            "_response_received_at": response_received_at,
        }

    def _generate_claude(
        self,
        model: str,
        prompt: str,
        temperature: float,
        max_tokens: int,
        on_request_start: Callable[[], None] | None,
    ) -> dict:

        client = OpenAI(
            api_key=settings.anthropic_api_key,
            base_url="https://api.anthropic.com/v1/",
            timeout=30.0,
            max_retries=0,
        )

        messages = [
            {
                "role": "user",
                "content": prompt,
            }
        ]

        if on_request_start is not None:
            on_request_start()

        start_time = time.perf_counter()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        response_received_at = time.perf_counter()

        output = response.choices[0].message.content or ""

        usage = response.usage

        input_tokens = usage.prompt_tokens if usage else 0
        output_tokens = usage.completion_tokens if usage else 0

        return {
            "output": output,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "provider_latency_ms": int(
                (response_received_at - start_time) * 1000
            ),
            "_response_received_at": response_received_at,
        }


provider_service = ProviderService()