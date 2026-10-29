from pydantic import BaseModel


class StatsResponse(BaseModel):
    total_requests: int

    total_actual_cost: float
    total_estimated_cost: float
    total_baseline_cost: float

    money_saved: float
    savings_percentage: float

    average_latency_ms: float

    average_quality_score: float | None
    escalation_rate: float

    simple_requests: int
    moderate_requests: int
    complex_requests: int

    ollama_requests: int
    gemini_requests: int
    claude_requests: int