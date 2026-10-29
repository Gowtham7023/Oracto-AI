from dataclasses import dataclass
from typing import Any, Literal

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.services.complexity_dataset import TRAINING_DATA
from app.services.feature_service import feature_service


ComplexityLevel = Literal["simple", "moderate", "complex"]


@dataclass(frozen=True)
class ClassifierState:
    model: Pipeline
    training_samples: int
    test_samples: int
    accuracy: float
    classification_report: dict[str, Any]


class ComplexityService:

    FEATURE_NAMES = [
        "word_count",
        "character_count",
        "sentence_count",
        "question_mark_count",
        "exclamation_count",
        "newline_count",
        "number_count",
        "bullet_count",
        "code_indicator",
        "context_indicator",
        "output_format_indicator",
        "reasoning_keyword_count",
        "comparison_keyword_count",
        "analysis_keyword_count",
        "constraint_keyword_count",
        "instruction_count",
        "question_count",
    ]

    CLASSES = ["simple", "moderate", "complex"]

    def __init__(self) -> None:
        self._state = self._train_model()

    @property
    def model(self) -> Pipeline:
        return self._state.model

    @property
    def classification_report(self) -> dict[str, Any]:
        return self._state.classification_report

    def _train_model(self) -> ClassifierState:
        x_all = []
        y_all = []

        for prompt, label in TRAINING_DATA:
            features = feature_service.extract_features(prompt)
            x_all.append([features[name] for name in self.FEATURE_NAMES])
            y_all.append(label)

        x_train, x_test, y_train, y_test = train_test_split(
            x_all,
            y_all,
            test_size=0.2,
            stratify=y_all,
            random_state=42,
        )

        candidate_model = Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2000,
                        C=1.0,
                    ),
                ),
            ]
        )
        candidate_model.fit(x_train, y_train)

        y_pred = candidate_model.predict(x_test)

        return ClassifierState(
            model=candidate_model,
            training_samples=len(x_train),
            test_samples=len(x_test),
            accuracy=round(float(accuracy_score(y_test, y_pred)), 4),
            classification_report=classification_report(
                y_test,
                y_pred,
                output_dict=True,
                zero_division=0,
            ),
        )

    def retrain(self) -> dict[str, Any]:
        candidate_state = self._train_model()
        self._state = candidate_state
        return self.get_model_status()

    def get_model_status(self) -> dict[str, Any]:
        state = self._state
        return {
            "model_type": "LogisticRegression",
            "training_samples": state.training_samples,
            "test_samples": state.test_samples,
            "accuracy": state.accuracy,
            "classes": self.CLASSES.copy(),
            "classification_report": state.classification_report,
        }

    def analyze(self, prompt: str) -> dict[str, Any]:
        features = feature_service.extract_features(prompt)

        feature_vector = [
            features[name] for name in self.FEATURE_NAMES
        ]
        model = self._state.model

        prediction = model.predict(
            [feature_vector]
        )[0]

        probabilities = model.predict_proba(
            [feature_vector]
        )[0]

        confidence = float(max(probabilities))

        return {
            "complexity": str(prediction),
            "confidence": round(confidence, 4),
            "features": features,
        }


complexity_service = ComplexityService()
