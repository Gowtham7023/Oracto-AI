from pydantic import BaseModel


class ModelResponse(BaseModel):
    provider: str
    model_id: str
    quality_tier: int
    input_cost_per_1k_tokens: float
    output_cost_per_1k_tokens: float
    average_latency_ms: int
    enabled: bool