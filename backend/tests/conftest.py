from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.routes import router
from app.database.database import get_db
from app.models.database_models import Base
from app.schemas.routing_config_schema import RoutingConfigUpdate
from app.services.router_service import router_service


@pytest.fixture
def test_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def app(test_engine):
    application = FastAPI()
    application.include_router(router, prefix="/api/v1")

    def override_get_db() -> Iterator[Session]:
        with Session(test_engine) as session:
            yield session

    application.dependency_overrides[get_db] = override_get_db
    return application


@pytest.fixture
def client(app) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def reset_routing_config():
    router_service.update_routing_config(
        RoutingConfigUpdate.model_validate(
            {
                "simple_min_tier": 1,
                "moderate_min_tier": 2,
                "complex_min_tier": 3,
                "quality_threshold": 0.70,
                "enable_escalation": True,
            }
        )
    )
    yield
    router_service.update_routing_config(
        RoutingConfigUpdate.model_validate(
            {
                "simple_min_tier": 1,
                "moderate_min_tier": 2,
                "complex_min_tier": 3,
                "quality_threshold": 0.70,
                "enable_escalation": True,
            }
        )
    )


@pytest.fixture(autouse=True)
def mock_provider_availability(monkeypatch):
    monkeypatch.setattr(
        "app.services.router_service.provider_service.check_availability",
        lambda provider, model: (True, "Available in test."),
    )
