from typing import Any

from typing import Literal

from pydantic import BaseModel


class ClassifierStatusResponse(BaseModel):
    model_type: str
    training_samples: int
    test_samples: int
    accuracy: float
    classes: list[str]
    classification_report: dict[str, Any] | None = None


class ClassifierRetrainResponse(BaseModel):
    status: Literal["retrained"]
    model_type: str
    training_samples: int
    test_samples: int
    accuracy: float
    classes: list[str]
