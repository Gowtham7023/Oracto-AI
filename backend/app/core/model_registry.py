from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass
class ModelConfig:
    provider: str
    model_id: str
    quality_tier: int
    input_cost_per_1k_tokens: float
    output_cost_per_1k_tokens: float
    average_latency_ms: int
    enabled: bool = True
    is_benchmark: bool = False


def load_models() -> list[ModelConfig]:
    config_path = Path(__file__).parent / "models.yaml"

    with open(config_path, "r", encoding="utf-8") as file:
        data = yaml.safe_load(file)

    return [ModelConfig(**model) for model in data["models"]]


def get_benchmark_model() -> ModelConfig:
    """Find and return the single designated frontier benchmark model.

    Raises ValueError if zero or multiple benchmark models are configured.
    """
    models = load_models()
    benchmarks = [m for m in models if m.is_benchmark]

    if not benchmarks:
        raise ValueError("No benchmark model configured in models.yaml")

    if len(benchmarks) > 1:
        raise ValueError(
            f"Multiple benchmark models configured in models.yaml ({len(benchmarks)} found); exactly one required"
        )

    return benchmarks[0]