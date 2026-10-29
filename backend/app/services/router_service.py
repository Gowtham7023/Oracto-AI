import logging

from pydantic import ValidationError

from app.core.model_registry import ModelConfig
from app.schemas.routing_config_schema import (
    RoutingConfig,
    RoutingConfigUpdate,
)
from app.services.model_service import model_service
from app.services.provider_service import provider_service


logger = logging.getLogger(__name__)


class NoEligibleProviderError(ValueError):
    def __init__(
        self,
        complexity: str,
        required_tier: int,
        checked_models: list[dict[str, str | int | None]],
    ) -> None:
        self.complexity = complexity
        self.required_tier = required_tier
        self.checked_models = checked_models
        details = "; ".join(
            f"{item['provider']}/{item['model']}: {item['error_message']}"
            for item in checked_models
        ) or "No enabled model meets the required tier."
        super().__init__(
            f"No available provider for complexity '{complexity}' "
            f"(required tier {required_tier}). Checked: {details}"
        )


class RouterService:

    def __init__(self) -> None:
        self._routing_config = RoutingConfig()

    def get_routing_config(self) -> RoutingConfig:
        return self._routing_config

    def update_routing_config(
        self,
        updates: RoutingConfigUpdate,
    ) -> RoutingConfig:
        values = {
            **self._routing_config.model_dump(),
            **updates.model_dump(exclude_unset=True),
        }

        try:
            updated_config = RoutingConfig.model_validate(values)
        except ValidationError as exc:
            raise ValueError(
                f"Invalid routing configuration: {exc}"
            ) from exc

        self._routing_config = updated_config
        return self._routing_config

    def get_minimum_tier(self, complexity: str) -> int:
        config = self._routing_config
        return {
            "simple": config.simple_min_tier,
            "moderate": config.moderate_min_tier,
            "complex": config.complex_min_tier,
        }.get(complexity.lower(), config.simple_min_tier)

    def select_model(self, complexity: str) -> ModelConfig:
        required_tier = self.get_minimum_tier(complexity)

        eligible_models = [
            model
            for model in model_service.get_enabled_models()
            if model.quality_tier >= required_tier
        ]

        if not eligible_models:
            raise ValueError(
                f"No eligible model found for complexity: {complexity}"
            )

        selected_model = min(
            eligible_models,
            key=lambda model: (
                model.quality_tier,
                model.input_cost_per_1k_tokens
                + model.output_cost_per_1k_tokens,
                model.average_latency_ms,
            ),
        )

        return selected_model

    def get_fallback_models(
        self,
        complexity: str,
        failed_provider: str,
    ) -> list[ModelConfig]:

        required_tier = self.get_minimum_tier(complexity)

        models = [
            model
            for model in model_service.get_enabled_models()
            if (
                model.provider != failed_provider
                and model.quality_tier >= required_tier
            )
        ]

        models.sort(
            key=lambda model: (
                model.quality_tier,
                model.input_cost_per_1k_tokens
                + model.output_cost_per_1k_tokens,
                model.average_latency_ms,
            )
        )

        return models

    def get_routing_decision(
        self,
        complexity: str,
        confidence: float,
    ) -> dict:
        required_tier = self.get_minimum_tier(complexity)
        tier_eligible_models = [
            model
            for model in model_service.get_enabled_models()
            if model.quality_tier >= required_tier
        ]

        logger.info(
            "[Router] complexity=%s required_tier=%s",
            complexity,
            required_tier,
        )
        logger.info(
            "[Router] eligible_models=%s",
            [
                f"{model.provider}/{model.model_id}"
                for model in tier_eligible_models
            ],
        )

        available_models = []
        checked_models: list[dict[str, str | int | None]] = []
        for model in tier_eligible_models:
            available, reason = provider_service.check_availability(
                model.provider,
                model.model_id,
            )
            logger.info(
                "[ProviderCheck] %s / %s -> %s%s",
                model.provider,
                model.model_id,
                "available" if available else "unavailable",
                f": {reason}" if reason else "",
            )
            if available:
                available_models.append(model)
            else:
                checked_models.append(
                    {
                        "provider": model.provider,
                        "model": model.model_id,
                        "quality_tier": model.quality_tier,
                        "status": "unavailable",
                        "error_type": None,
                        "error_message": reason,
                    }
                )

        if not available_models:
            raise NoEligibleProviderError(
                complexity,
                required_tier,
                checked_models,
            )

        selected_model = min(
            available_models,
            key=lambda model: (
                model.quality_tier,
                model.input_cost_per_1k_tokens
                + model.output_cost_per_1k_tokens,
                model.average_latency_ms,
            ),
        )
        logger.info(
            "[Router] selected=%s/%s",
            selected_model.provider,
            selected_model.model_id,
        )

        return {
            "complexity": complexity,
            "confidence": confidence,
            "required_tier": required_tier,
            "selected_provider": selected_model.provider,
            "selected_model": selected_model.model_id,
            "quality_tier": selected_model.quality_tier,
            "available_models": available_models,
            "reason": (
                f"Selected {selected_model.model_id} "
                f"from {selected_model.provider} "
                f"for {complexity} complexity."
            ),
        }


router_service = RouterService()