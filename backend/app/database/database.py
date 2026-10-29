import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.models.database_models import Base


DATABASE_URL = os.getenv(
    "ORACTO_DATABASE_URL",
    "sqlite:///./oracto.db",
)


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def create_tables():
    Base.metadata.create_all(
        bind=engine,
    )
    columns = {
        column["name"]
        for column in inspect(engine).get_columns(
            "completion_records"
        )
    }
    missing_columns = {
        "verification_method": (
            "VARCHAR(20) NOT NULL DEFAULT 'unknown'"
        ),
        "primary_provider": "VARCHAR(50) NOT NULL DEFAULT ''",
        "primary_model": "VARCHAR(100) NOT NULL DEFAULT ''",
        "final_provider": "VARCHAR(50) NOT NULL DEFAULT ''",
        "final_model": "VARCHAR(100) NOT NULL DEFAULT ''",
        "fallback_used": "BOOLEAN NOT NULL DEFAULT 0",
        "fallback_reason": "TEXT",
        "quality_escalated": "BOOLEAN NOT NULL DEFAULT 0",
        "initial_model": "VARCHAR(100) NOT NULL DEFAULT ''",
        "initial_quality_score": "FLOAT",
        "final_quality_score": "FLOAT",
        "escalation_reason": "TEXT",
    }
    with engine.begin() as connection:
        for name, column_type in missing_columns.items():
            if name not in columns:
                connection.execute(
                    text(
                        f"ALTER TABLE completion_records "
                        f"ADD COLUMN {name} {column_type}"
                    )
                )


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
