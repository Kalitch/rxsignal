# RxSignal

> **FDA Regulatory Intelligence Platform** — search, monitor, and analyze public FDA data in real time with AI-assisted pharmacovigilance.



---

## What is RxSignal?

RxSignal is a full-stack regulatory intelligence platform built on top of the FDA's public API (openFDA). The goal is to turn raw FDA safety data — scattered across multiple endpoints and dense JSON formats — into interactive dashboards, search tools, and AI-assisted analyses that researchers, healthcare professionals, and pharmacovigilance teams can actually use without writing a single line of code.

The platform is built around three principles: **real data** (everything comes directly from the FDA, nothing is fabricated), **privacy** (the AI model runs locally via LM Studio, no data leaves your machine), and **speed** (a smart PostgreSQL cache protects API rate limits and keeps the interface fast).

---

## Features

### 📊 Dashboard
Platform-wide overview with live KPIs: total adverse event volume, top reported drugs, recall breakdown by severity class, and medical device event categories — all in one view.

### ⚠️ Adverse Events Explorer
Search the FAERS database (FDA Adverse Event Reporting System) for any drug. Visualizes the most frequently reported reactions in a ranked list, report volume over time as a line chart, serious vs. non-serious breakdown, and exports results to CSV.

### 💊 Drug Intelligence
Look up any FDA-registered drug by brand name, generic name, or NDC code. Displays the full FDA label (SPL) in a structured accordion — indications, warnings, boxed warnings, contraindications, dosage — alongside its regulatory approval history from Drugs@FDA.

### 🚨 Recall Monitor
Unified enforcement feed across drugs, devices, and food simultaneously. Filterable by domain and severity class (Class I / II / III). Refreshed every hour via cache.

### 🔬 Device Safety
Queries the MAUDE database (Manufacturer and User Facility Device Experience) to surface medical device adverse event reports broken down by event type — malfunction, injury, death.

### 🔍 NDC Lookup
Resolves any drug by its 10 or 11-digit NDC code, or by name. Returns active ingredients, dosage form, route of administration, labeler, and packaging variants.

### 🤖 AI Assistant
A chat interface that accepts plain English questions — *"what are the most serious side effects of Ozempic?"* — translates them into precise openFDA queries using Mistral 7B running locally via LM Studio, executes the search, and returns a plain-language safety summary. All processing happens on your machine.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | UI, routing, SSR |
| Backend | Django 5 + Django REST Framework | REST API, business logic, openFDA proxy |
| Database | PostgreSQL 16 | Persistence, FDA query cache |
| AI | Mistral 7B via LM Studio | NL→query translation, safety summarization |
| Data | openFDA API (api.fda.gov) | Source of truth — public FDA data |
| Auth | JWT via SimpleJWT | Stateless authentication |
| Infra | Docker Compose | Full local orchestration |

### Data Flow
```
Browser → Next.js → Django REST → PostgreSQL (cache check)
                                       ↓ cache miss
                                  openFDA API → cache write → response

                    ↓ AI path
              LM Studio (Mistral) → FDA query → results → summary
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for the database
- Python 3.11+
- Node.js 20+
- [LM Studio](https://lmstudio.ai/) — optional, only needed for the AI Assistant

### 1. Clone the repository

```bash
git clone https://github.com/your-username/rxsignal.git
cd rxsignal
```

### 2. Start the database

```bash
docker compose up db -d
```

### 3. Django Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit if needed
python manage.py migrate
python manage.py runserver
# → http://127.0.0.1:8000
```

> **Recommended:** Register a free API key at [open.fda.gov/apis/authentication](https://open.fda.gov/apis/authentication/) and add it to `.env` as `OPENFDA_API_KEY=your_key`. This raises your rate limit from 1,000 to 120,000 requests/day.

### 4. Next.js Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

> **Windows users:** Make sure `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` in your `.env.local` — Windows resolves `localhost` to IPv6 (`::1`) which Django doesn't bind to by default.

### 5. AI Assistant (optional)

1. Open LM Studio
2. Download **Mistral 7B Instruct v0.3** (Q4_K_M quantization recommended)
3. Go to **Local Server** tab → Start Server
4. The assistant connects automatically at `http://localhost:1234/v1`

---

## API Reference

### FDA Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fda/adverse-events/` | FAERS adverse event reports |
| GET | `/api/fda/drug-labels/` | FDA drug labels (SPL) |
| GET | `/api/fda/ndc/` | NDC directory lookup |
| GET | `/api/fda/drugsfda/` | Drugs@FDA approval history |
| GET | `/api/fda/recalls/` | Unified drug/device/food recalls |
| GET | `/api/fda/device-events/` | MAUDE device adverse events |
| GET | `/api/fda/dashboard/` | Aggregate KPI stats |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/query/` | NL prompt → FDA query → summary |
| POST | `/api/ai/summarize/` | Summarize a set of FDA results |
| GET  | `/api/ai/history/` | Recent AI query log |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Login → JWT tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET  | `/api/auth/me/` | Current user profile |

---

## Cache Strategy

All openFDA responses are cached in PostgreSQL to protect rate limits and keep the UI fast:

| Endpoint | TTL |
|----------|-----|
| Adverse events | 6 hours |
| Drug labels | 24 hours |
| NDC directory | 24 hours |
| Recalls / enforcement | 1 hour |
| Count / aggregate queries | 12 hours |

---

## Project Structure

```
rxsignal/
├── docker-compose.yml
├── backend/
│   ├── config/                  # Settings, URLs, WSGI
│   ├── apps/
│   │   ├── core/                # Auth, users, watchlists
│   │   ├── fda/                 # openFDA client, cache, endpoints
│   │   │   ├── client.py        ← HTTP client + cache-aside logic
│   │   │   ├── models.py        ← FDAQueryCache model
│   │   │   └── views.py         ← All FDA REST views
│   │   └── intelligence/        # Mistral / LM Studio
│   │       ├── client.py        ← NL→query + summarization
│   │       └── views.py         ← /api/ai/ endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.tsx             # Dashboard
    │   ├── adverse-events/      # FAERS explorer
    │   ├── drugs/               # Drug search + detail page
    │   ├── recalls/             # Recall monitor
    │   ├── devices/             # Device safety
    │   ├── ndc/                 # NDC lookup
    │   └── assistant/           # AI chat
    ├── components/
    │   ├── layout/              # Sidebar, Topbar
    │   └── ui/                  # Shared components
    └── lib/
        └── api.ts               # HTTP client → Django
```

---

## Roadmap — Phase 2

- [ ] Drug shortage monitor (`/drug/shortages.json`)
- [ ] Device 510(k) + PMA regulatory pathway explorer
- [ ] Food adverse events module (CAERS)
- [ ] Celery + Redis for scheduled signal detection jobs
- [ ] Email / webhook alerts for watched drugs
- [ ] Frontend authentication UI
- [ ] Saved search and watchlist persistence

---

## Data Sources

All data is sourced from [openFDA](https://open.fda.gov/) — a public initiative by the U.S. Food & Drug Administration. Data has not been validated for clinical or production use. RxSignal is a research and analytics tool, not a substitute for professional medical guidance.

---

## License

MIT