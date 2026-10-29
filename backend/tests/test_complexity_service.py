from app.schemas.classifier_schema import ClassifierRetrainResponse
from app.services.complexity_service import ComplexityService, complexity_service


def test_classifier_loads_and_analyzes():
    service = ComplexityService()
    result = service.analyze("What is Python?")

    assert result["complexity"] in {"simple", "moderate", "complex"}
    assert 0 <= result["confidence"] <= 1
    assert set(result["features"]) == set(service.FEATURE_NAMES)
    assert service.get_model_status()["classes"] == [
        "simple",
        "moderate",
        "complex",
    ]


def test_classifier_status_api(client):
    response = client.get("/api/v1/classifier/status")

    assert response.status_code == 200
    status = response.json()
    assert status["model_type"] == "LogisticRegression"
    assert status["training_samples"] > 0
    assert status["test_samples"] > 0
    assert 0 <= status["accuracy"] <= 1
    assert status["classes"] == ["simple", "moderate", "complex"]


def test_classifier_retrain_api(client):
    response = client.post("/api/v1/classifier/retrain")

    assert response.status_code == 200
    result = ClassifierRetrainResponse.model_validate(response.json())
    assert result.status == "retrained"
    assert result.training_samples == 171
    assert result.test_samples == 43
    assert 0 <= result.accuracy <= 1
    assert result.classes == ["simple", "moderate", "complex"]
    assert complexity_service.analyze("What is Python?")["complexity"] in (
        result.classes
    )
