# Oracto Backend

Oracto Backend is an intelligent LLM routing, escalation, and quality evaluation gateway built with **FastAPI**, **scikit-learn**, and **SQLAlchemy**.

It dynamically analyzes prompt complexity and semantic features to route inference requests to the optimal model tier (Tier 1 local Ollama, Tier 2 Gemini Flash, Tier 3 Claude Sonnet), evaluates output quality, handles automatic escalations on failure, and computes token cost savings against frontier baselines.

---

## Features

- **Machine Learning Complexity Classifier**: Logistic Regression pipeline utilizing multi-dimensional text features (word count, code syntax, constraints, reasoning markers, analysis indicators) to score prompt complexity (`simple`, `moderate`, `complex`).
- **Dynamic Tier-Based Routing**:
  - **Tier 1 (Local / Free)**: Ollama (e.g., `llama3.2:3b`) - fast, free, private.
  - **Tier 2 (Mid-Tier / Cost-Effective)**: Google Gemini (e.g., `gemini-3.8-flash`) - high speed and quality balance.
  - **Tier 3 (Frontier Benchmark)**: Anthropic Claude (e.g., `claude-sonnet-4-6`) - highest reasoning capability.
- **Automated Escalation & Fallbacks**: If a lower-tier provider fails or returns sub-threshold quality responses, the gateway seamlessly retries and escalates to a higher-tier provider while tracking the full execution trace.
- **Quality & Cost Observability**: Tracks input/output token usage, calculates actual costs per request, compares costs against pure frontier baseline routing, and logs quality metrics.
- **Interactive API & Health Monitoring**: Built-in Swagger UI and OpenAPI documentation at `/docs`.

---

## Tech Stack

- **Framework**: FastAPI & Uvicorn (ASGI)
- **Database**: SQLite with SQLAlchemy ORM
- **Machine Learning**: scikit-learn, NumPy
- **Providers**: Anthropic Python SDK, Google Generative AI / OpenAI-compatible APIs, Ollama REST
- **Testing**: pytest, anyio, httpx

---

## Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Virtual environment tool (`venv`)

### 2. Create and Activate Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. Configure Environment
Copy `.env.example` from the root directory to `.env` or set environment variables:
```bash
GEMINI_API_KEY="your-gemini-key"
ANTHROPIC_API_KEY="your-anthropic-key"
OLLAMA_BASE_URL="http://localhost:11434"
ORACTO_DATABASE_URL="sqlite:///./oracto.db"
DEBUG=true
```

### 5. Run the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be accessible at:
- **API Base**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Running Tests

Run the full automated test suite (66 tests covering routing, cost calculations, escalation logic, quality scoring, and API endpoints):

```bash
pytest
```

To run with verbose output:
```bash
pytest -v
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API routers & endpoints (routes.py, health.py)
│   ├── core/                # Configuration, model registry & models.yaml
│   ├── database/            # SQLAlchemy database engine & session management
│   ├── models/              # SQLAlchemy database ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   └── services/            # Core business logic services:
│       ├── complexity_service.py     # ML classifier for prompt complexity
│       ├── complexity_dataset.py     # Training dataset for complexity scoring
│       ├── completion_service.py     # Completion execution & prompt dispatch
│       ├── cost_service.py           # Token calculation & savings analytics
│       ├── escalation_service.py     # Fallback & escalation chain logic
│       ├── feature_service.py        # Text feature extractor
│       ├── generation_settings_service.py # Model generation hyperparameter store
│       ├── model_service.py          # Model configuration & registry access
│       ├── provider_service.py       # API wrappers for Ollama, Gemini, Claude
│       ├── quality_service.py        # Response quality verification
│       └── router_service.py         # Dynamic routing logic
├── tests/                   # 66 pytest unit & integration tests
├── Dockerfile               # Production Docker container image
├── .dockerignore            # Files excluded from Docker builds
├── main.py                  # FastAPI application entrypoint
├── pytest.ini               # Test configuration
├── requirements.txt         # Production runtime dependencies
└── requirements-dev.txt     # Development and testing dependencies
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/v1/completions` | Execute an LLM completion with automatic ML routing |
| `GET` | `/api/v1/models` | List all registered models and active statuses |
| `GET` | `/api/v1/routing-config` | Fetch active tier routing thresholds |
| `PUT` | `/api/v1/routing-config` | Update routing configuration and minimum tiers |
| `GET` | `/api/v1/requests` | List historical routed completion requests |
| `GET` | `/api/v1/requests/{id}` | Get detailed execution trace for a request |
| `GET` | `/api/v1/analytics/stats` | High-level cost, quality, and escalation statistics |
| `GET` | `/api/v1/analytics/cost` | Detailed token cost breakdowns and savings |
| `GET` | `/api/v1/analytics/routing` | Distribution of queries across tiers and models |
| `GET` | `/api/v1/analytics/quality` | Quality score metrics and breakdown |
| `GET` | `/api/v1/analytics/escalation` | Escalation frequency, causes, and transitions |
| `GET` | `/api/v1/classifier/report` | ML classifier accuracy and precision/recall report |
| `POST` | `/api/v1/classifier/retrain`| Trigger on-demand retraining of the complexity classifier |
