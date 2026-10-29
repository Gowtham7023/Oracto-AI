from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class CompletionRecord(Base):
    __tablename__ = "completion_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    request_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    prompt: Mapped[str] = mapped_column(
        Text,
    )

    output: Mapped[str] = mapped_column(
        Text,
    )

    complexity: Mapped[str] = mapped_column(
        String(20),
    )

    confidence: Mapped[float] = mapped_column(
        Float,
    )

    required_tier: Mapped[int] = mapped_column(
        Integer,
    )

    provider: Mapped[str] = mapped_column(
        String(50),
    )

    model: Mapped[str] = mapped_column(
        String(100),
    )

    quality_tier: Mapped[int] = mapped_column(
        Integer,
    )

    input_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    output_tokens: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    estimated_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    actual_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    latency_ms: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    quality_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
    )

    verification_method: Mapped[str] = mapped_column(
        String(20),
        default="unknown",
        server_default=text("'unknown'"),
    )

    primary_provider: Mapped[str] = mapped_column(
        String(50),
        default="",
        server_default=text("''"),
    )

    primary_model: Mapped[str] = mapped_column(
        String(100),
        default="",
        server_default=text("''"),
    )

    final_provider: Mapped[str] = mapped_column(
        String(50),
        default="",
        server_default=text("''"),
    )

    final_model: Mapped[str] = mapped_column(
        String(100),
        default="",
        server_default=text("''"),
    )

    fallback_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("0"),
    )

    fallback_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    quality_escalated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("0"),
    )

    initial_model: Mapped[str] = mapped_column(
        String(100),
        default="",
        server_default=text("''"),
    )

    initial_quality_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    final_quality_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    escalation_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    escalated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    routing_reason: Mapped[str] = mapped_column(
        Text,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    @property
    def baseline_cost(self) -> float:
        return self.estimated_cost