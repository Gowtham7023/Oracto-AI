from pydantic import BaseModel, Field


class QualityDimensions(BaseModel):
    correctness: float
    relevance: float
    completeness: float
    instruction_following: float


class QualityVerificationResponse(BaseModel):
    quality_score: float
    verification_status: str
    verification_method: str
    dimensions: QualityDimensions
    reason: str


class AttemptedModelResponse(BaseModel):
    provider: str
    model: str
    quality_tier: int
    status: str
    error_type: str | None = None
    error_message: str | None = None


class CompletionRoutingResponse(BaseModel):
    primary_provider: str
    primary_model: str
    final_provider: str
    final_model: str
    fallback_used: bool
    fallback_reason: str | None
    quality_escalated: bool
    initial_model: str
    initial_quality_score: float
    final_quality_score: float
    escalation_reason: str | None
    attempted_models: list[AttemptedModelResponse]


class GenerationSettingsResponse(BaseModel):
    mode: str
    temperature: float
    max_tokens: int


class CompletionRequest(BaseModel):
    prompt: str = Field(min_length=1)
    generation_mode: str = Field(default="automatic")
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, gt=0)


class CompletionResponse(BaseModel):
    request_id: str
    output: str

    complexity: str
    confidence: float

    required_tier: int
    model: str
    provider: str
    quality_tier: int
    routing_reason: str

    estimated_cost: float
    baseline_cost: float
    actual_cost: float
    latency_ms: int

    quality_score: float | None = None
    verification_status: str = "pending"
    verification_method: str = "unknown"
    quality: QualityVerificationResponse | None = None
    routing: CompletionRoutingResponse
    escalated: bool = False
    generation_settings: GenerationSettingsResponse