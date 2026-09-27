# Project Handoff & Status — Development Priority Intelligence

## Status Table

| STEP | Title | Status |
| :--- | :--- | :--- |
| **STEP 0** | Scaffold (Layout, LICENSE, .env.example, CREDITS, README, HANDOFF, /health) | **DONE** |
| **STEP 1** | Data schema + storage layer (SQLite local default, config/india.json) | **DONE** |
| **STEP 2** | Healthcare vertical slice: real data (Loaders, pilot districts, ingest.py) | **DONE** |
| **STEP 3** | Synthetic citizen requests (150–300 requests, en/hi/mr, time-spread) | **DONE** |
| **STEP 4** | Scoring engine (deterministic, weights.json, District C>A>B test) | **DONE** |
| **STEP 5** | Impact Measurement Engine (Pre vs Post completion comparison) | **DONE** |
| **STEP 6** | Policymaker Dashboard (plain HTML+CSS+JS, Leaflet, 6 tabs, Voice, Offline fallback) | **DONE** |
| **STEP 7** | Gemini understanding layer (ADK / pipeline, USE_MOCK_GEMINI) | **DONE** |
| **STEP 8** | Gemini explanation layer + NL query (/explain, /query endpoints) | **DONE** |
| **STEP 9** | Backend API completion (CORS, validation, endpoints, tests) | **DONE** |
| **STEP 10** | Deploy config (render.yaml, Firebase Hosting, GitHub Actions) | **DONE** |
| **STEP 11** | BRICS + DPG docs (ARCHITECTURE.md, README.md, honest census note, CREDITS.md) | **DONE** |
| **STEP 12** | Submission docs (BRIEF_DESCRIPTION.md, DEMO_SCRIPT.md, PITCH_OUTLINE.md) | **DONE** |
| **STEP 13** | Photo evidence via Gemini multimodal (Citizen upload + Vision API) | **DONE** |

---

## How to Run

### Environment Setup
```bash
# Copy template
cp .env.example .env

# Required environment variables (.env):
# GEMINI_API_KEY=your_key_here
# USE_MOCK_GEMINI=true   (set true to run offline without quota usage)
# STORAGE_BACKEND=sqlite (local zero-setup SQLite store)
```

### Ingest Real & Synthetic Data
```bash
python scripts/ingest.py
```

### Run Tests
```bash
python -m pytest tests/
```

### Run Backend API
```bash
uvicorn backend.app.main:app --reload --port 8000
```

---

## What Works
- **Scaffolding & Architecture**: Fast, lightweight, zero-cost stack with `/health` and `/api/health`.
- **Open Schemas & Storage**: JSON Schemas in `docs/schemas/`, pluggable SQLite storage in `data/dpi_local.db`.
- **Real Healthcare & Demographics Ingestion (STEP 2)**:
  - 3 pilot districts across 2 states: **Pune** (MH), **Thane** (MH), and **Varanasi** (UP).
  - Verified geo-coded hospitals from National Hospital Directory (`data.gov.in`).
  - Verified PHCs and CHCs from All India Health Centres Directory (`data.gov.in`).
  - Real baseline population figures from **Census 2011** combined with **NFHS-5 (2019-21)** district estimates.
  - Lineage tracking via `dataset_version` entries (`national_hospital_directory_v1`, `all_india_health_centres_v1`, `census_nfhs5_demographics_v1`).
- **Synthetic Citizen Demand Ingestion (STEP 3)**:
  - 220 synthetic citizen requests exclusively targeting Pune, Thane, and Varanasi.
  - Multilingual support: English (`en`), Hindi (`hi`), Marathi (`mr`).
  - Channels: `voice`, `text`, `messaging_app`.
  - Phrasing variations per `DATASET_GUIDE.md` across healthcare, water/sanitation, roads/transport, and education.
  - Timestamps spread across 5–450 days ago for before/after impact measurement testing.
  - Tagged with `data_quality: "synthetic"` and recorded in dataset version lineage (`synthetic_citizen_requests_v1`).
- **Deterministic Priority Scoring Engine (STEP 4)**:
  - Implemented in `backend/engine/scoring.py` with configurable weights in `config/weights.json`.
  - Exposes per-input breakdowns and exact weight lineage with every score.
  - Includes **Silent Need Detector** (`backend/engine/silent_need_detector.py`) identifying high-pop, high-deficit regions with low reporting.
  - Includes **Investment-Demand Mismatch Detector** (`backend/engine/mismatch_detector.py`) highlighting over-funded vs under-funded districts.
  - Includes **Existing-Project Check** (`backend/engine/project_check.py`) evaluating ongoing and completed government project coverage.
  - Verified with Worked Sanity Check (`tests/test_worked_example.py`) strictly asserting score order: **District C > District A > District B**.
- **Impact Measurement Engine (STEP 5)**:
  - Implemented in `backend/engine/impact_engine.py`.
  - Compares citizen request volume in equal time windows (e.g. 90/180 days) BEFORE vs AFTER project completion dates.
  - Seeded 3 completed government projects (`data/synthetic/completed_projects.json`) with before/after request timestamps demonstrating demand reduction.
  - Includes mandatory disclaimer: `"based on available data, not a guarantee"`.
- **Backend API Completion (STEP 9)**:
  - Reorganized routes using FastAPI `APIRouter` with `/api/v1` prefix and backward-compatible root alias mounts.
  - Strict Pydantic Field validation for `SubmitRequestModel` (`raw_text` length 1–2000, `source_channel` enum `"voice"`|`"text"`|`"messaging_app"`) and `QueryModel` (`query` length 1–500), returning 422 HTTP errors on invalid input.
  - Tightened CORS configuration in `backend/app/config.py` with configurable origin lists via `ALLOWED_ORIGINS` env var (wildcard `*` removed).
  - Resolved Python 3.12 `datetime.utcnow()` deprecation warnings with `datetime.now(timezone.utc)`.
- **BRICS & DPG Documentation (STEP 11)**:
  - Completely rewrote `README.md` with executive summary, problem pillars, Gemini architecture diagram, real data disclosure, BRICS mapping, and Google Cloud production roadmap.
  - Expanded `ARCHITECTURE.md` with Section 5 (Country Onboarding Workflow for Brazil/South Africa) and Section 6 (Google Cloud Production Scale-Up).
  - Populated `CREDITS.md` with official government citations (`data.gov.in`, Census 2011, NFHS-5) and open source licenses.
- **Hackathon Submission Package (STEP 12)**:
  - Created `docs/submission/BRIEF_DESCRIPTION.md` (2–3 line summary options).
  - Created `docs/submission/DEMO_SCRIPT.md` (minute-by-minute 3–5 min video recording script).
  - Created `docs/submission/PITCH_OUTLINE.md` (10–12 slide deck outline).
- **Citizen / Policymaker Portal Separation**:
  - Created `frontend/login.html` with dual-role authentication (Citizen vs. Policymaker).
  - Created `frontend/citizen.html` dedicated citizen submission portal with voice input and multilingual UI.
  - Added authentication guard and sign-out logic to `frontend/index.html`.
- **Gemini Multimodal Photo Evidence (STEP 13)**:
  - Implemented `analyze_infrastructure_photo()` in `backend/services/gemini_service.py` to evaluate citizen photo evidence using Gemini 1.5 Flash vision (with offline fallback).
  - Exposed `/api/v1/analyze-photo` and `/analyze-photo` endpoints with Pydantic validation (`AnalyzePhotoModel`).
  - Integrated photo upload and instant AI verification card in `frontend/citizen.html`.
  - Added unit test suite `tests/test_step13_multimodal.py` testing image analysis, severity scoring, and category mapping.
- **Tests**: **145/145 tests passing** (100% pass rate).

## Known Gaps
- Request-level rate limiting not yet enforced (optional production feature).

---

## MANUAL TASKS
- Set `GEMINI_API_KEY` in `.env` if testing non-mock Gemini queries.
- Deploy live: Push backend to Render (`render.yaml`) and frontend to Firebase/Vercel (`firebase.json`).
- Record 3–5 min demo video using `docs/submission/DEMO_SCRIPT.md`.
- Export 10–12 slide pitch deck using `docs/submission/PITCH_OUTLINE.md`.

---

## UI/UX Redesign Track (Frontend Only)

### Redesign Status Table

| Step | Title | Status |
| :--- | :--- | :--- |
| **STEP 0** | Audit + design tokens (`tokens.css`, hardcoded audit in HANDOFF.md) | **DONE** |
| **STEP 1** | Global shell: icons + shared components (Lucide CDN, shared buttons/inputs/cards/badges) | **DONE** |
| **STEP 2** | Login screen redesign (Styled inputs, clean brand glyph, muted demo credentials box) | PENDING |
| **STEP 3** | Policymaker dashboard: navbar + layout skeleton (Single primary green, compact lang dropdown, rebalanced columns) | PENDING |
| **STEP 4** | Policymaker dashboard: default populated state (Auto-select top district on load, whole numbers, soft map legend) | PENDING |
| **STEP 5** | Policymaker dashboard: table + tabs polish (Distinct typography, hover/active states, tab data verification) | PENDING |
| **STEP 6** | Citizen portal polish (Category padding consistency, auto-detect voice reporting, submit validation) | PENDING |
| **STEP 7** | Cross-screen consistency pass (Single primary green, no emoji icons, unified badges, final review) | PENDING |

---

### STEP 0 — Audit & Inventory

#### 1. Frontend Files Inventory
- **Screens**:
  - `frontend/login.html`: Dual-role authentication portal (Citizen vs Policymaker) with credentials hint and animated backdrop.
  - `frontend/index.html`: Policymaker Intelligence Dashboard (Leaflet map, 6 tab panels, sidebar filters, evidence panel, dataset footer).
  - `frontend/citizen.html`: Citizen Voice & Text Request Portal (4 category cards, voice speech recognition, photo upload + Gemini vision card, form submission, recent requests).
- **Styles**:
  - `frontend/styles/tokens.css`: **NEW** Design tokens defining primary green, neutrals, 3-level status colors, typography, radius, and 8px spacing scale.
  - `frontend/css/style.css`: Dashboard stylesheet currently using blue accent (`#1d4ed8`), mixed radii, and hardcoded paddings.
  - Embedded CSS in `login.html` (lines 11–258).
  - Embedded CSS in `citizen.html` (lines 11–412).
- **JavaScript & Component Renderers**:
  - `frontend/js/app.js`: Main orchestrator, data loading, tab switching, map initialization.
  - `frontend/js/panels.js`: Renders Evidence Panel, Ranked Tab, Silent Needs Tab, Mismatch Tab, Impact Tab, AI Command Center Tab, Submit Request Tab.
  - `frontend/js/charts.js`: Inline SVG generators (`renderBreakdownSVG`, `renderQuadrantScatterSVG`).
  - `frontend/js/map.js`: Leaflet markers, color scales, popup generator, inline legend card.
  - `frontend/js/api.js`: API client for backend and mock fallbacks.
  - `frontend/js/i18n.js`: Multilingual translations dictionary (en, hi, mr).
  - `frontend/js/voice.js`: Web Speech API wrapper for citizen dictation.
- **Mock Fallback Data**:
  - `frontend/mock/districts.json`, `explain_pune.json`, `silent_needs.json`, `mismatches.json`, `impact.json`, `datasets.json`.

#### 2. Hardcoded Color Audit Across Codebase
- **Inconsistent Primary / Accent Colors**:
  - Dashboard navbar & accents (`style.css`): `#1d4ed8` (Royal Blue), hover `#1e40af`, tint `#eff6ff`.
  - Dashboard status/chips (`style.css`, `panels.js`): `#dbeafe`, `#0284c7`, `#e0f2fe`, `#0369a1`.
  - Login screen (`login.html`): `#0f0c29`, `#1a1a4e`, `#24243e` (deep purple/indigo gradient), `#6366f1` / `#4f46e5` (indigo), `#a5b4fc`, `rgba(99,102,241,...)`.
  - Citizen portal (`citizen.html`): `#059669` (Emerald Green), `#065f46`, `#10b981`, `#d1fae5`, `#f0fdf4`.
  - *Target*: Replace all with unified Primary Green `--dpi-primary: #059669` and tint `--dpi-primary-pale: #ecfdf5`.
- **Status / Priority Colors (to unify into Red / Amber / Green)**:
  - Critical / High Need: `#dc2626`, `#ef4444`, `#fee2e2`, `#991b1b`, `#fca5a5`, `#fff1f2`.
  - Moderate Need / Warning / Synthetic: `#d97706`, `#f59e0b`, `#fef3c7`, `#92400e`, `#fffbeb`, `#fbbf24`.
  - Baseline / Success / Real Data: `#059669`, `#10b981`, `#d1fae5`, `#065f46`, `#064e3b`, `#86efac`, `#166534`.
  - *Target*: Standardize on `--dpi-status-critical-*`, `--dpi-status-warning-*`, `--dpi-status-success-*`.
- **Neutrals & Surfaces**:
  - App background: `#f8fafc`, `#f0fdf4`, `#fafafa`.
  - Borders: `#e2e8f0`, `#d1d5db`, `#cbd5e1`, `#f3f4f6`, `rgba(255,255,255,0.10)`.
  - Text: `#0f172a`, `#111827`, `#1e293b`, `#374151`, `#475569`, `#6b7280`, `#64748b`.

#### 3. Hardcoded Spacing & Padding Audit
- Found inconsistent paddings: `14px`, `10px 14px`, `9px 12px`, `7px 10px`, `12px 16px`, `32px 28px`, `28px`, `20px 12px`, `15px`, `48px 24px 80px`.
- Found gaps: `4px`, `6px`, `8px`, `10px`, `12px`, `16px`, `20px`, `32px`.
- *Target*: Convert to 8px base grid (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).

#### 4. Hardcoded Radius & Typography Audit
- Radii: `4px`, `8px`, `10px`, `12px`, `14px`, `16px`, `20px`, `24px`.
  - *Target*: Standardize to `8px` (inputs/buttons) and `10px` (cards/panels) with `9999px` for pills.
- Typography: Weight variations `300`, `400`, `500`, `600`, `700`, `800`.
  - *Target*: Headings `700`, labels/section headers `500` with letter-spacing, body `400`. Whole number scores (round `Math.round()` on all score displays).

#### 5. Emoji Icon Inventory (To replace with Lucide/Feather CDN in subsequent steps)
- Login: `🇮🇳` (country flag/glyph), `🌐` (BRICS badge), `🧑‍🌾` (Citizen role), `🏛️` (Policymaker role), `❌` (error).
- Dashboard Navbar & Layout: `🇮🇳` (country pill), `⚠️` (offline notice), `📊` (Ranked), `🔇` (Silent need), `⚖️` (Mismatch), `📈` (Impact), `🤖` (AI Command), `📝` (Submit request), `🗺️` (empty map), `📌` (footnote), `📦` (data sources), `📋` (census note), `⏳` (loading), `🎤` / `⏹️` (mic).
- Citizen Portal: `🌿` (brand), `🏥` (healthcare), `💧` (water), `🛣️` (roads), `🏫` (education), `📝` (form), `🎙️` (mic), `📷` (camera), `✨` (Gemini), `📤` (submit), `✅` (success), `📋` (recent).

---

### STEP 1 — Global Shell: Icons + Shared Components
- Created `frontend/styles/shared.css` with token-based button (`.btn-primary`, `.btn-secondary`, `.btn-subtle`), input, card, badge (`.badge-real`, `.badge-synthetic`), and status chip styling.
- Connected Lucide CDN script (`https://unpkg.com/lucide@latest`) across `index.html`, `login.html`, and `citizen.html`.
- Connected `frontend/css/style.css` to import `tokens.css` and `shared.css`.
- Wired `window.refreshIcons()` helper across all screens to automatically instantiate Lucide SVG icons.

---

## NEXT STEP
Proceed to **STEP 2 — Login screen redesign**. Style inputs with proper borders/focus rings, demote/pair the "IN" glyph, mute BRICS badge, quiet down the demo credentials box, and replace role emojis with Lucide icons.




