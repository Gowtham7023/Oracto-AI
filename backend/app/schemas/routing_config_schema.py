from pydantic import BaseModel, ConfigDict, Field, model_validator


class RoutingConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    simple_min_tier: int = Field(default=1, gt=0, strict=True)
    moderate_min_tier: int = Field(default=2, gt=0, strict=True)
    complex_min_tier: int = Field(default=3, gt=0, strict=True)
    quality_threshold: float = Field(
        default=0.70,
        ge=0,
        le=1,
        strict=True,
    )
    enable_escalation: bool = Field(default=True, strict=True)

    @model_validator(mode="after")
    def validate_tier_order(self) -> "RoutingConfig":
        if not (
            self.simple_min_tier
            <= self.moderate_min_tier
            <= self.complex_min_tier
        ):
            raise ValueError(
                "Tier minimums must satisfy "
                "simple_min_tier <= moderate_min_tier "
                "<= complex_min_tier."
            )
        return self


class RoutingConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    simple_min_tier: int | None = Field(default=None, gt=0, strict=True)
    moderate_min_tier: int | None = Field(default=None, gt=0, strict=True)
    complex_min_tier: int | None = Field(default=None, gt=0, strict=True)
    quality_threshold: float | None = Field(
        default=None,
        ge=0,
        le=1,
        strict=True,
    )
    enable_escalation: bool | None = Field(default=None, strict=True)
