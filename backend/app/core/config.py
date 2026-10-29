from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    app_name: str = "Oracto API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Gemini
    gemini_api_key: str = ""

    # Anthropic Claude
    anthropic_api_key: str = ""

    # Ollama
    ollama_base_url: str = "http://localhost:11434"

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), str(BACKEND_ENV_FILE)),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()