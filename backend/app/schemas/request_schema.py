from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    request_id: str
    prompt: str
    output: str

    complexity: str
    confidence: float

    required_tier: int
    provider: str
    model: str
    quality_tier: int

    input_tokens: int
    output_tokens: int

    estimated_cost: float
    baseline_cost: float
    actual_cost: float

    latency_ms: int

    quality_score: float | None
    verification_status: str
    verification_method: str
    primary_provider: str
    primary_model: str
    final_provider: str
    final_model: str
    fallback_used: bool
    fallback_reason: str | None
    quality_escalated: bool
    initial_model: str
    initial_quality_score: float | None
    final_quality_score: float | None
    escalation_reason: str | None
    escalated: bool

    routing_reason: str
    created_at: datetime