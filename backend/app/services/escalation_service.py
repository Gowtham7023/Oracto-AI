from app.core.model_registry import ModelConfig
from app.services.model_service import model_service
from app.services.router_service import router_service


class EscalationService:

    def should_escalate(
        self,
        quality_score: float,
        quality_threshold: float,
        enable_escalation: bool,
    ) -> bool:
        """
        Determine whether a response should be
        escalated to a higher-quality model.
        """

        return (
            enable_escalation
            and quality_score < quality_threshold
        )

    def get_escalation_model(
        self,
        current_model: ModelConfig,
    ) -> ModelConfig | None:
        """
        Find the next available higher-quality model.
        """

        higher_tier_models = [
            model
            for model in model_service.get_enabled_models()
            if (
                model.quality_tier
                > current_model.quality_tier
            )
        ]

        if not higher_tier_models:
            return None

        higher_tier_models.sort(
            key=lambda model: (
                model.quality_tier,
                model.input_cost_per_1k_tokens
                + model.output_cost_per_1k_tokens,
            )
        )

        return higher_tier_models[0]

    def get_escalation_decision(
        self,
        quality_score: float,
        current_model: ModelConfig,
    ) -> dict:

        config = router_service.get_routing_config()

        should_escalate = self.should_escalate(
            quality_score=quality_score,
            quality_threshold=config.quality_threshold,
            enable_escalation=config.enable_escalation,
        )

        escalation_model = None

        if should_escalate:
            escalation_model = (
                self.get_escalation_model(
                    current_model
                )
            )

        return {
            "should_escalate": (
                should_escalate
                and escalation_model is not None
            ),
            "current_model": current_model.model_id,
            "current_provider": current_model.provider,
            "escalation_model": (
                escalation_model.model_id
                if escalation_model
                else None
            ),
            "escalation_provider": (
                escalation_model.provider
                if escalation_model
                else None
            ),
            "current_quality_tier": (
                current_model.quality_tier
            ),
            "escalation_quality_tier": (
                escalation_model.quality_tier
                if escalation_model
                else None
            ),
        }


escalation_service = EscalationService()