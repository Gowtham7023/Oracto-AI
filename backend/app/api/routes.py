import logging
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.database_models import CompletionRecord
from app.schemas.analytics_schema import StatsResponse
from app.schemas.classifier_schema import (
    ClassifierRetrainResponse,
    ClassifierStatusResponse,
)
from app.schemas.completion_schema import (
    CompletionRequest,
    CompletionResponse,
)
from app.schemas.model_schema import ModelResponse
from app.schemas.request_schema import RequestResponse
from app.schemas.routing_config_schema import (
    RoutingConfig,
    RoutingConfigUpdate,
)
from app.services.complexity_service import complexity_service
from app.services.cost_service import cost_service
from app.services.escalation_service import escalation_service
from app.services.generation_settings_service import generation_settings_service
from app.services.model_service import model_service
from app.services.provider_service import provider_service
from app.services.quality_service import quality_service
from app.services.router_service import (
    NoEligibleProviderError,
    router_service,
)


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/models", response_model=list[ModelResponse])
def get_models():
    return model_service.get_all_models()


@router.get(
    "/routing-config",
    response_model=RoutingConfig,
)
def get_routing_config():
    return router_service.get_routing_config()


@router.put(
    "/routing-config",
    response_model=RoutingConfig,
)
def update_routing_config(
    updates: RoutingConfigUpdate,
):
    try:
        return router_service.update_routing_config(updates)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@router.get("/requests", response_model=list[RequestResponse])
def get_requests(
    db: Session = Depends(get_db),
):
    return (
        db.query(CompletionRecord)
        .order_by(CompletionRecord.created_at.desc())
        .all()
    )


@router.get(
    "/requests/{request_id}",
    response_model=RequestResponse,
)
def get_request(
    request_id: str,
    db: Session = Depends(get_db),
):
    record = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.request_id == request_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Request not found.",
        )

    return record


@router.get(
    "/stats",
    response_model=StatsResponse,
)
def get_stats(
    db: Session = Depends(get_db),
):
    total_requests = (
        db.query(CompletionRecord).count()
    )

    total_actual_cost = (
        db.query(
            func.coalesce(
                func.sum(
                    CompletionRecord.actual_cost
                ),
                0.0,
            )
        ).scalar()
    )

    total_input_tokens = (
        db.query(
            func.coalesce(
                func.sum(
                    CompletionRecord.input_tokens
                ),
                0,
            )
        ).scalar()
    )

    total_output_tokens = (
        db.query(
            func.coalesce(
                func.sum(
                    CompletionRecord.output_tokens
                ),
                0,
            )
        ).scalar()
    )

    total_baseline_cost = cost_service.calculate_benchmark_cost(
        input_tokens=int(total_input_tokens),
        output_tokens=int(total_output_tokens),
    )

    money_saved = (
        total_baseline_cost
        - float(total_actual_cost)
    )

    savings_percentage = (
        (
            money_saved
            / total_baseline_cost
        )
        * 100
        if total_baseline_cost > 0
        else 0.0
    )

    average_latency = (
        db.query(
            func.coalesce(
                func.avg(
                    CompletionRecord.latency_ms
                ),
                0.0,
            )
        ).scalar()
    )

    average_quality = (
        db.query(
            func.avg(
                CompletionRecord.quality_score
            )
        )
        .filter(
            CompletionRecord.quality_score.is_not(None)
        )
        .scalar()
    )

    escalated_count = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.escalated.is_(True)
        )
        .count()
    )

    simple_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.complexity == "simple"
        )
        .count()
    )

    moderate_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.complexity == "moderate"
        )
        .count()
    )

    complex_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.complexity == "complex"
        )
        .count()
    )

    ollama_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.provider == "ollama"
        )
        .count()
    )

    gemini_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.provider == "gemini"
        )
        .count()
    )

    claude_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.provider == "claude"
        )
        .count()
    )

    escalation_rate = (
        (
            escalated_count
            / total_requests
        )
        * 100
        if total_requests > 0
        else 0.0
    )

    return {
        "total_requests": total_requests,
        "total_actual_cost": round(
            float(total_actual_cost),
            8,
        ),
        "total_estimated_cost": round(
            total_baseline_cost,
            8,
        ),
        "total_baseline_cost": round(
            total_baseline_cost,
            8,
        ),
        "money_saved": round(
            money_saved,
            8,
        ),
        "savings_percentage": round(
            savings_percentage,
            2,
        ),
        "average_latency_ms": round(
            float(average_latency),
            2,
        ),
        "average_quality_score": (
            round(
                float(average_quality),
                4,
            )
            if average_quality is not None
            else None
        ),
        "escalation_rate": round(
            escalation_rate,
            2,
        ),
        "simple_requests": simple_requests,
        "moderate_requests": moderate_requests,
        "complex_requests": complex_requests,
        "ollama_requests": ollama_requests,
        "gemini_requests": gemini_requests,
        "claude_requests": claude_requests,
    }


@router.get("/analytics/cost")
def get_cost_analytics(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            CompletionRecord.provider,
            func.count(
                CompletionRecord.id
            ).label("requests"),
            func.coalesce(
                func.sum(
                    CompletionRecord.actual_cost
                ),
                0.0,
            ).label("actual_cost"),
            func.coalesce(
                func.sum(
                    CompletionRecord.input_tokens
                ),
                0,
            ).label("input_tokens"),
            func.coalesce(
                func.sum(
                    CompletionRecord.output_tokens
                ),
                0,
            ).label("output_tokens"),
        )
        .group_by(
            CompletionRecord.provider
        )
        .all()
    )

    result = []
    for row in rows:
        actual_cost = float(row.actual_cost)
        baseline_cost = cost_service.calculate_benchmark_cost(
            input_tokens=int(row.input_tokens),
            output_tokens=int(row.output_tokens),
        )
        money_saved = baseline_cost - actual_cost
        savings_percentage = (
            (money_saved / baseline_cost) * 100
            if baseline_cost > 0
            else 0.0
        )
        result.append(
            {
                "provider": row.provider,
                "requests": row.requests,
                "actual_cost": round(actual_cost, 8),
                "estimated_cost": round(baseline_cost, 8),
                "baseline_cost": round(baseline_cost, 8),
                "money_saved": round(money_saved, 8),
                "savings_percentage": round(savings_percentage, 2),
            }
        )

    return result


@router.get("/analytics/routing")
def get_routing_analytics(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            CompletionRecord.complexity,
            CompletionRecord.provider,
            func.count(
                CompletionRecord.id
            ).label("requests"),
        )
        .group_by(
            CompletionRecord.complexity,
            CompletionRecord.provider,
        )
        .all()
    )

    return [
        {
            "complexity": row.complexity,
            "provider": row.provider,
            "requests": row.requests,
        }
        for row in rows
    ]


@router.get("/analytics/quality")
def get_quality_analytics(
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            CompletionRecord.verification_status,
            CompletionRecord.verification_method,
            func.count(
                CompletionRecord.id
            ).label("requests"),
            func.avg(
                CompletionRecord.quality_score
            ).label("average_quality"),
        )
        .filter(
            CompletionRecord.quality_score.is_not(None)
        )
        .group_by(
            CompletionRecord.verification_status,
            CompletionRecord.verification_method,
        )
        .all()
    )

    return [
        {
            "verification_status": row.verification_status,
            "verification_method": row.verification_method,
            "requests": row.requests,
            "average_quality": (
                round(
                    float(row.average_quality),
                    4,
                )
                if row.average_quality is not None
                else None
            ),
        }
        for row in rows
    ]


@router.get("/analytics/escalation")
def get_escalation_analytics(
    db: Session = Depends(get_db),
):
    total_requests = (
        db.query(CompletionRecord).count()
    )

    escalated_requests = (
        db.query(CompletionRecord)
        .filter(
            CompletionRecord.escalated.is_(True)
        )
        .count()
    )

    non_escalated_requests = (
        total_requests
        - escalated_requests
    )

    escalation_rate = (
        (
            escalated_requests
            / total_requests
        )
        * 100
        if total_requests > 0
        else 0.0
    )

    return {
        "total_requests": total_requests,
        "escalated_requests": escalated_requests,
        "non_escalated_requests": non_escalated_requests,
        "escalation_rate": round(
            escalation_rate,
            2,
        ),
    }


@router.get(
    "/classifier/status",
    response_model=ClassifierStatusResponse,
)
def get_classifier_status():
    return complexity_service.get_model_status()


@router.get("/classifier/report")
def get_classifier_report():
    return complexity_service.classification_report


@router.post(
    "/classifier/retrain",
    response_model=ClassifierRetrainResponse,
)
def retrain_classifier():
    try:
        status = complexity_service.retrain()
    except Exception as exc:
        logger.exception("Classifier retraining failed")
        raise HTTPException(
            status_code=500,
            detail="Classifier retraining failed.",
        ) from exc

    return {
        "status": "retrained",
        **{
            key: status[key]
            for key in (
                "model_type",
                "training_samples",
                "test_samples",
                "accuracy",
                "classes",
            )
        },
    }


@router.post(
    "/completions",
    response_model=CompletionResponse,
)
def create_completion(
    request: CompletionRequest,
    db: Session = Depends(get_db),
):
    request_id = str(uuid.uuid4())

    # -------------------------------------------------
    # 1. Analyze prompt complexity
    # -------------------------------------------------

    complexity_result = complexity_service.analyze(
        request.prompt
    )

    complexity = str(
        complexity_result["complexity"]
    )

    confidence = float(
        complexity_result["confidence"]
    )

    # -------------------------------------------------
    # 2. Determine generation settings
    # -------------------------------------------------

    gen_settings = (
        generation_settings_service.resolve_generation_settings(
            complexity=complexity,
            generation_mode=request.generation_mode,
            manual_temperature=request.temperature,
            manual_max_tokens=request.max_tokens,
        )
    )
    resolved_temperature = float(gen_settings["temperature"])
    resolved_max_tokens = int(gen_settings["max_tokens"])

    # -------------------------------------------------
    # 3. Select primary model
    # -------------------------------------------------

    try:
        routing = router_service.get_routing_decision(
            complexity=complexity,
            confidence=confidence,
        )
    except NoEligibleProviderError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "message": str(exc),
                "required_tier": exc.required_tier,
                "attempted_models": exc.checked_models,
            },
        ) from exc

    primary_provider = routing[
        "selected_provider"
    ]

    primary_model = routing[
        "selected_model"
    ]

    required_tier = routing[
        "required_tier"
    ]

    routing_reason = routing[
        "reason"
    ]

    # -------------------------------------------------
    # 4. Find primary model configuration
    # -------------------------------------------------

    primary_config = next(
        model
        for model in model_service.get_enabled_models()
        if (
            model.provider == primary_provider
            and model.model_id == primary_model
        )
    )

    # -------------------------------------------------
    # 5. Build valid fallback list
    # -------------------------------------------------

    fallback_models = [
        model
        for model in routing["available_models"]
        if (
            model.provider != primary_provider
            or model.model_id != primary_model
        )
    ]

    models_to_try = [
        primary_config,
        *fallback_models,
    ]

    # -------------------------------------------------
    # 6. Generate response
    # -------------------------------------------------

    result = None
    final_model_config = None
    request_started_at = None
    latency_ms = 0

    attempted_models = []
    fallback_reason = None

    def mark_provider_request_start() -> None:
        nonlocal request_started_at
        if request_started_at is None:
            request_started_at = time.perf_counter()

    for model_config in models_to_try:
        try:
            result = provider_service.generate(
                provider=model_config.provider,
                model=model_config.model_id,
                prompt=request.prompt,
                temperature=resolved_temperature,
                max_tokens=resolved_max_tokens,
                on_request_start=mark_provider_request_start,
            )

            # Spans the first provider request through this response, including retries.
            if request_started_at is not None:
                latency_ms = int(
                    (
                        result["_response_received_at"]
                        - request_started_at
                    )
                    * 1000
                )
            final_model_config = model_config
            attempted_models.append(
                {
                    "provider": model_config.provider,
                    "model": model_config.model_id,
                    "quality_tier": model_config.quality_tier,
                    "status": "succeeded",
                    "error_type": None,
                }
            )
            break

        except Exception as exc:
            if request_started_at is not None:
                latency_ms = int(
                    (time.perf_counter() - request_started_at)
                    * 1000
                )

            error_message = provider_service.describe_error(exc)
            logger.warning(
                "[ProviderCheck] %s / %s -> generation failed (%s): %s",
                model_config.provider,
                model_config.model_id,
                type(exc).__name__,
                error_message,
            )
            attempted_models.append(
                {
                    "provider": model_config.provider,
                    "model": model_config.model_id,
                    "quality_tier": model_config.quality_tier,
                    "status": "failed",
                    "error_type": type(exc).__name__,
                    "error_message": error_message,
                }
            )

    # -------------------------------------------------
    # 6. No valid model available
    # -------------------------------------------------

    if (
        result is None
        or final_model_config is None
    ):
        failure_details = "; ".join(
            f"{attempt['provider']}/{attempt['model']}: "
            f"{attempt.get('error_message') or attempt['error_type']}"
            for attempt in attempted_models
        )

        raise HTTPException(
            status_code=503,
            detail={
                "message": (
                    f"No eligible LLM provider is available for "
                    f"complexity '{complexity}' (required tier "
                    f"{required_tier}). Checked: {failure_details}"
                ),
                "required_tier": required_tier,
                "attempted_models": attempted_models,
            },
        )

    # -------------------------------------------------
    # 7. Technical fallback detection
    # -------------------------------------------------

    fallback_used = (
        (
            final_model_config.provider != primary_provider
            or final_model_config.model_id != primary_model
        )
        and bool(attempted_models)
        and any(
            attempt["status"] == "failed"
            for attempt in attempted_models[:-1]
        )
    )

    if fallback_used:
        fallback_reason = (
            "The primary provider failed; a tier-eligible fallback succeeded."
        )
        routing_reason = (
            routing_reason
            + " Primary provider failed; a tier-eligible fallback was used."
        )

    # -------------------------------------------------
    # 8. Calculate initial cost
    # -------------------------------------------------

    input_tokens = int(
        result.get(
            "input_tokens",
            0,
        )
    )

    output_tokens = int(
        result.get(
            "output_tokens",
            0,
        )
    )

    actual_cost = cost_service.calculate_cost(
        model=final_model_config,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )

    # -------------------------------------------------
    # 9. Initial quality verification
    # -------------------------------------------------

    quality_result = quality_service.verify(
        prompt=request.prompt,
        response=result["output"],
    )

    quality_score = float(
        quality_result["quality_score"]
    )

    verification_status = quality_result[
        "verification_status"
    ]
    verification_method = quality_result[
        "verification_method"
    ]
    initial_model = final_model_config.model_id
    initial_quality_score = quality_score
    final_quality_score = quality_score
    escalation_reason = None
    routing_config = router_service.get_routing_config()

    # -------------------------------------------------
    # 10. Quality-based escalation
    # -------------------------------------------------

    quality_escalated = False

    if quality_score < routing_config.quality_threshold:

        escalation_decision = (
            escalation_service.get_escalation_decision(
                quality_score=quality_score,
                current_model=final_model_config,
            )
        )

        if escalation_decision[
            "should_escalate"
        ]:

            escalation_model = (
                escalation_service.get_escalation_model(
                    final_model_config
                )
            )

            if escalation_model is not None:

                escalation_generated = False
                try:
                    escalation_result = (
                        provider_service.generate(
                            provider=(
                                escalation_model.provider
                            ),
                            model=(
                                escalation_model.model_id
                            ),
                            prompt=request.prompt,
                            temperature=resolved_temperature,
                            max_tokens=resolved_max_tokens,
                            on_request_start=mark_provider_request_start,
                        )
                    )
                    escalation_generated = True

                    attempted_models.append(
                        {
                            "provider": escalation_model.provider,
                            "model": escalation_model.model_id,
                            "quality_tier": escalation_model.quality_tier,
                            "status": "succeeded",
                            "error_type": None,
                        }
                    )
                    if request_started_at is not None:
                        latency_ms = int(
                            (
                                escalation_result[
                                    "_response_received_at"
                                ]
                                - request_started_at
                            )
                            * 1000
                        )

                    escalation_input_tokens = int(
                        escalation_result.get(
                            "input_tokens",
                            0,
                        )
                    )
                    escalation_output_tokens = int(
                        escalation_result.get(
                            "output_tokens",
                            0,
                        )
                    )
                    actual_cost += cost_service.calculate_cost(
                        model=escalation_model,
                        input_tokens=escalation_input_tokens,
                        output_tokens=escalation_output_tokens,
                    )
                    input_tokens += escalation_input_tokens
                    output_tokens += escalation_output_tokens

                    escalation_quality = (
                        quality_service.verify(
                            prompt=request.prompt,
                            response=(
                                escalation_result[
                                    "output"
                                ]
                            ),
                        )
                    )

                    escalation_quality_score = float(
                        escalation_quality[
                            "quality_score"
                        ]
                    )

                    quality_escalated = True
                    if escalation_quality_score >= quality_score:
                        result = escalation_result
                        final_model_config = escalation_model
                        quality_score = escalation_quality_score
                        verification_status = (
                            escalation_quality[
                                "verification_status"
                            ]
                        )
                        quality_result = escalation_quality
                        verification_method = (
                            escalation_quality[
                                "verification_method"
                            ]
                        )
                        final_quality_score = quality_score
                        escalation_reason = (
                            "Initial quality score was below the configured "
                            "threshold; the higher-tier response scored at "
                            "least as well and was selected."
                        )
                    else:
                        escalation_reason = (
                            "The higher-tier response scored lower; the "
                            "higher-scoring initial response was retained."
                        )

                    routing_reason += (
                        " Initial response was below the configured "
                        "quality threshold; a higher-tier response was "
                        "verified."
                    )

                except Exception as exc:
                    if escalation_generated:
                        attempted_models[-1]["status"] = (
                            "verification_failed"
                        )
                        attempted_models[-1]["error_type"] = (
                            type(exc).__name__
                        )
                    else:
                        attempted_models.append(
                            {
                                "provider": escalation_model.provider,
                                "model": escalation_model.model_id,
                                "quality_tier": escalation_model.quality_tier,
                                "status": "failed",
                                "error_type": type(exc).__name__,
                            }
                        )
                    if request_started_at is not None:
                        latency_ms = int(
                            (
                                time.perf_counter()
                                - request_started_at
                            )
                            * 1000
                        )
                    escalation_reason = (
                        "Higher-tier generation or verification failed; "
                        "the initial response was retained."
                    )
                    routing_reason = (
                        routing_reason
                        + " Higher-tier quality escalation failed; "
                        "the initial response was retained."
                    )
            else:
                escalation_reason = (
                    "No enabled higher-tier model was available."
                )
        else:
            escalation_reason = (
                "Quality escalation is disabled or no higher-tier model exists."
            )

    # -------------------------------------------------
    # 11. Final escalation state
    # -------------------------------------------------

    escalated = fallback_used or quality_escalated

    # Baseline cost uses the configured frontier benchmark model; estimated_cost is its
    # legacy SQLite/API storage field.
    baseline_cost = cost_service.calculate_benchmark_cost(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )

    # -------------------------------------------------
    # 12. Save database record
    # -------------------------------------------------

    record = CompletionRecord(
        request_id=request_id,
        prompt=request.prompt,
        output=result["output"],
        complexity=complexity,
        confidence=confidence,
        required_tier=required_tier,
        provider=final_model_config.provider,
        model=final_model_config.model_id,
        quality_tier=final_model_config.quality_tier,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        estimated_cost=baseline_cost,
        actual_cost=actual_cost,
        latency_ms=latency_ms,
        quality_score=quality_score,
        verification_status=verification_status,
        verification_method=verification_method,
        primary_provider=primary_provider,
        primary_model=primary_model,
        final_provider=final_model_config.provider,
        final_model=final_model_config.model_id,
        fallback_used=fallback_used,
        fallback_reason=fallback_reason,
        quality_escalated=quality_escalated,
        initial_model=initial_model,
        initial_quality_score=initial_quality_score,
        final_quality_score=final_quality_score,
        escalation_reason=escalation_reason,
        escalated=escalated,
        routing_reason=routing_reason,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # -------------------------------------------------
    # 13. Return final response
    # -------------------------------------------------

    return {
        "request_id": request_id,
        "output": result["output"],
        "complexity": complexity,
        "confidence": confidence,
        "required_tier": required_tier,
        "model": final_model_config.model_id,
        "provider": final_model_config.provider,
        "quality_tier": final_model_config.quality_tier,
        "routing_reason": routing_reason,
        "estimated_cost": baseline_cost,
        "baseline_cost": baseline_cost,
        "actual_cost": actual_cost,
        "latency_ms": latency_ms,
        "quality_score": quality_score,
        "verification_status": verification_status,
        "verification_method": verification_method,
        "quality": quality_result,
        "routing": {
            "primary_provider": primary_provider,
            "primary_model": primary_model,
            "final_provider": final_model_config.provider,
            "final_model": final_model_config.model_id,
            "fallback_used": fallback_used,
            "fallback_reason": fallback_reason,
            "quality_escalated": quality_escalated,
            "initial_model": initial_model,
            "initial_quality_score": initial_quality_score,
            "final_quality_score": final_quality_score,
            "escalation_reason": escalation_reason,
            "attempted_models": attempted_models,
        },
        "escalated": escalated,
        "generation_settings": gen_settings,
    }