from typing import Any, TypedDict


class GenerationSettingsDict(TypedDict):
    temperature: float
    max_tokens: int


class GenerationSettingsService:
    """Authoritative service for determining generation settings based on complexity or manual overrides."""

    DEFAULT_SETTINGS: dict[str, GenerationSettingsDict] = {
        "simple": {
            "temperature": 0.20,
            "max_tokens": 128,
        },
        "moderate": {
            "temperature": 0.20,
            "max_tokens": 2048,
        },
        "complex": {
            "temperature": 0.15,
            "max_tokens": 4096,
        },
    }

    FALLBACK_SETTINGS: GenerationSettingsDict = {
        "temperature": 0.20,
        "max_tokens": 2048,
    }

    def get_generation_settings(
        self,
        complexity: str,
    ) -> GenerationSettingsDict:
        """Return the authoritative automatic generation settings for a given complexity."""
        normalized_complexity = (complexity or "").lower().strip()
        return self.DEFAULT_SETTINGS.get(
            normalized_complexity,
            self.FALLBACK_SETTINGS,
        )

    def resolve_generation_settings(
        self,
        complexity: str,
        generation_mode: str = "automatic",
        manual_temperature: float | None = None,
        manual_max_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Resolve the effective generation settings based on the mode and complexity."""
        normalized_mode = (generation_mode or "automatic").lower().strip()

        if normalized_mode == "manual":
            temperature = (
                manual_temperature
                if manual_temperature is not None
                else 0.20
            )
            max_tokens = (
                manual_max_tokens
                if manual_max_tokens is not None
                else 2048
            )
            return {
                "mode": "manual",
                "temperature": float(temperature),
                "max_tokens": int(max_tokens),
            }

        # Automatic mode (authoritative defaults by complexity)
        auto_settings = self.get_generation_settings(complexity)
        return {
            "mode": "automatic",
            "temperature": auto_settings["temperature"],
            "max_tokens": auto_settings["max_tokens"],
        }


generation_settings_service = GenerationSettingsService()
