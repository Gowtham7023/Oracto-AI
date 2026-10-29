# Oracto Frontend

The Oracto Frontend is a modern, high-performance web dashboard and interactive playground built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.

It provides real-time observability and control over Oracto's intelligent LLM gateway, featuring interactive prompt testing, execution trace inspection, live cost savings charts, routing configuration controls, and model management.

---

## Features

- **Interactive Playground**: Send test prompts and inspect real-time complexity classification, model selection rationale, latency, token costs, and responses.
- **Deep Execution Traces**: Detailed inspection drawer showcasing step-by-step routing decisions, model fallback chains, latency per attempt, and quality evaluation flags.
- **Observability & Analytics Dashboard**:
  - Cost analysis comparing actual spend vs. 100% frontier model baseline spend.
  - Tier distribution charts (Tier 1 vs. Tier 2 vs. Tier 3).
  - Model latency trends and escalation frequency metrics.
- **Routing & Configuration Control**:
  - Dynamic adjustments of complexity tier mapping.
  - Confidence threshold tweaking and fallback policies.
  - Interactive React Flow visualization of the routing pipeline.
- **Model Registry & Status**:
  - Monitor health, latency, provider status, and cost per 1K tokens for Ollama, Gemini, and Claude.
- **Dark Mode & Responsive Design**: Custom glassmorphism UI styled with Tailwind CSS v4 and Lucide icons.

---

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8 with TypeScript
- **Styling**: Tailwind CSS v4 & custom design tokens
- **Data Fetching & Caching**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **Data Visualizations**: Recharts
- **Pipeline Flow Graph**: ReactFlow
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## Local Development Setup

### 1. Prerequisites
- Node.js 20+ (LTS recommended)
- npm 10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `frontend-app` directory (or use root `.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 4. Run Development Server
```bash
npm run dev
```

The application will start at:
[http://localhost:5173](http://localhost:5173)

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run preview` | Locally serves the production build for testing |
| `npm run lint` | Runs ESLint against TypeScript and TSX code |

---

## Project Structure

```
frontend-app/
├── public/                 # Static public assets (icons, favicon)
├── src/
│   ├── assets/             # Brand logos and graphic assets
│   ├── components/         # Reusable UI component library:
│   │   ├── DetailDrawer.tsx    # Slide-over execution trace drawer
│   │   ├── EmptyState.tsx      # Consistent empty data states
│   │   ├── ErrorState.tsx      # Resilient error boundary states
│   │   ├── ExecutionTrace.tsx  # Step-by-step visual routing trace
│   │   ├── LoadingState.tsx    # Animated skeleton & loader states
│   │   ├── MetricCard.tsx      # KPI & metric summary cards
│   │   ├── SectionHeader.tsx   # Standardized section headings
│   │   └── StatusBadge.tsx     # Color-coded status pills
│   ├── layouts/            # Page layouts:
│   │   ├── MainLayout.tsx      # Shell layout with topbar and responsive navigation
│   │   └── Sidebar.tsx         # Collapsible sidebar navigation
│   ├── pages/              # Route pages:
│   │   ├── Dashboard.tsx       # System overview, KPIs, and recent activity
│   │   ├── Playground.tsx      # Live LLM prompt tester and routing inspector
│   │   ├── Requests.tsx        # Request history table with deep filters
│   │   ├── Models.tsx          # Provider model registry and status
│   │   ├── Routing.tsx         # Routing policy editor and pipeline diagram
│   │   ├── Quality.tsx         # Quality score evaluations and threshold monitoring
│   │   ├── Analytics.tsx       # Deep cost, latency, and distribution analytics
│   │   └── Settings.tsx        # System parameters and API key status
│   ├── services/           # Axios API client and API methods
│   ├── types/              # TypeScript interfaces and data models
│   ├── App.tsx             # Main routing configuration
│   ├── index.css           # Global Tailwind CSS definitions and utility styles
│   └── main.tsx            # React application root render
├── Dockerfile              # Multi-stage production Docker build (Node build -> Nginx)
├── nginx.conf              # Production Nginx reverse-proxy and SPA routing configuration
└── package.json            # Project dependencies and npm scripts
```

---

## Production Docker Deployment

The frontend includes a multi-stage Dockerfile that builds the static assets and serves them with a lightweight Nginx web server:

```bash
docker build -t oracto-frontend .
docker run -p 80:80 oracto-frontend
```
