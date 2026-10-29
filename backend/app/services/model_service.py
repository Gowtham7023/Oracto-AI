from app.core.model_registry import ModelConfig, load_models


class ModelService:
    def __init__(self):
        self.models: list[ModelConfig] = load_models()

    def get_all_models(self) -> list[ModelConfig]:
        return self.models

    def get_enabled_models(self) -> list[ModelConfig]:
        return [model for model in self.models if model.enabled]


model_service = ModelService()