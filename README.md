# StudyPilot AI

> **Your syllabus. Your strategy. Your success.**

StudyPilot AI is a full-stack, personalized academic planning and study companion that transforms unstructured course syllabi, examination deadlines, student availability, and real-time progress into a realistic, actionable, and dynamically adjustable study schedule.

StudyPilot AI combines **deterministic algorithmic scheduling** (strict time windows, break buffers, conflict detection, and daily study limits) with **Google Gemini AI intelligence** (syllabus breakdown, pedagogical strategy recommendations, and an interactive study mentor).

---

## Key Features

1. **Intelligent Onboarding & Student Profile**:
   - Define custom daily study availability with **multi-window support** (e.g., Morning 06:00–08:00 and Evening 18:00–21:00).
   - Set session length, break duration, and maximum daily study limits.
   - Resumable and editable at any time.

2. **Subject & Syllabus Management**:
   - Organize courses, units, and hierarchical topics.
   - Track difficulty, estimated study time, and confidence ratings (1 to 5).
   - **Dual-mode Syllabus Parsing**:
     - *Fast Rule-Based Parser*: Instant offline extraction from structured outline or bullet-point text.
     - *Gemini AI-Powered Parser*: Semantic parsing of unstructured syllabus text into clean units, topics, and difficulties.
   - Review and edit topics before saving.

3. **Hybrid AI & Deterministic Planner Engine**:
   - **Transparent Priority Scoring Algorithm**:
     $$\text{Priority} = 0.35 \times \text{Urgency} + 0.20 \times \text{Importance} + 0.15 \times \text{Difficulty} + 0.20 \times \text{Confidence Deficit} + 0.10 \times \text{Status}$$
   - Enforces student availability, inserts mandatory break buffers, and respects examination deadlines (no new learning scheduled on/after exam dates).
   - **Honest Capacity Overload Detection**: Proactively flags when required study time exceeds available capacity and provides high-priority triage advice.
   - **Gemini Strategy Guidance**: Suggests pedagogical session objectives, activities, and breakdown advice.

4. **Adaptive Rescheduling & Task Tracking**:
   - **Live Focus Session Timer**: Digital countdown timer with pause, resume, and completion logging.
   - Record actual minutes studied, post-session confidence, and progress notes.
   - **Adaptive Reschedule Workflow**: Re-allocates missed or incomplete sessions into future available slots while preserving completed records.
   - Lock sessions to prevent automated displacement.

5. **Multi-View Academic Calendar**:
   - Month Grid view, Week horizon, and Agenda (List) view.
   - Filter by subject, task type, and status.
   - Mobile-optimized layout with zero horizontal overflow.

6. **Contextual AI Study Assistant**:
   - Multi-turn educational mentor powered by the official `@google/genai` SDK.
   - Conceptual explanations, step-by-step topic breakdowns, and exam practice question generation.
   - Context-aware without leaking private student data.

7. **Progress & Academic Analytics**:
   - Overall and subject-wise syllabus coverage charts (powered by Chart.js).
   - Planned vs. Actual study time tracking.
   - **Transparent Exam Readiness Diagnostic**: Evidence-based metric incorporating coverage, confidence, and revision backlog with an "Insufficient data" safeguard.
   - **Weak Topic Diagnostic Radar**: Surfaces high-priority topics with low confidence.

8. **Settings, Themes & Data Portability**:
   - Charcoal dark mode (default) and clean light mode.
   - Live Gemini API health check and connection latency tester.
   - Atomic JSON backup export and import with schema validation.
   - Complete workspace reset with confirmation.

---

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom properties, CSS Grid & Flexbox), Vanilla ES6 JavaScript modules.
- **Visuals & Charts**: Chart.js for data visualization, Lucide icons.
- **Backend**: Node.js, Express.js REST API architecture.
- **AI Integration**: Official Google Gen AI JavaScript SDK (`@google/genai`), `dotenv`.
- **Data Persistence**: Browser `localStorage` with versioned schema (`1.0.0`) and JSON export/import.
- **Testing**: Vitest for automated unit and integration tests, Supertest for backend endpoint testing.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v24+ recommended).
- **npm**: v9.0.0 or higher.
- **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
- **Web Browser**: Modern browser (Chrome, Edge, Firefox, Safari) with JavaScript enabled.

---

## Installation & Quick Start

### 1. Clone or Open Workspace
```bash
cd "d:/Sapiens/Webinars/03 Agentic Eng P1/Practise/Study Planner"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

> **Security Note**: Your `GEMINI_API_KEY` is stored **strictly on the backend**. It is never exposed in frontend files, network responses, or client bundles.

### 4. Start the Application

#### Development Mode (with automatic restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### 5. Access the Web Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## Automated Testing

StudyPilot AI includes a comprehensive automated test suite covering scheduling logic, priority algorithms, date math, syllabus parsers, progress metrics, and backend REST routes.

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Suite Structure
- `tests/unit/priorityAlgorithm.test.js`: Verifies multi-factor priority formula.
- `tests/unit/timeWindowUtils.test.js`: Validates timezone-safe date math and time window math.
- `tests/unit/deterministicScheduler.test.js`: Tests overlap prevention, break buffers, exam deadlines, and over-capacity detection.
- `tests/unit/adaptiveRescheduler.test.js`: Tests relocation of missed tasks, locked session preservation, and duplicate prevention.
- `tests/unit/ruleBasedParser.test.js`: Tests heuristic syllabus text extraction.
- `tests/unit/progressCalculator.test.js`: Tests syllabus coverage %, readiness breakdown, and insufficient data guards.
- `tests/unit/storageMigration.test.js`: Tests atomic JSON backup validation and schema integrity.
- `tests/integration/healthRoutes.test.js`: Tests `/api/health` and `/api/ai/status` endpoints.
- `tests/integration/aiRoutes.test.js`: Tests `/api/ai/*` input validation and error handling.

---

## Google Gemini Setup & Configuration

### 1. Obtaining an API Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google Account.
3. Click **Get API key** and create a new API key.
4. Paste the key into your `.env` file under `GEMINI_API_KEY`.

### 2. Supported Models
- `gemini-2.5-flash` *(Default)*: Fast, highly cost-effective, and excels at structured JSON output.
- `gemini-2.5-pro`: Recommended for deeper conceptual tutoring and advanced reasoning.

### 3. Testing Your Connection
1. Open the application and navigate to **Settings** (`#/settings`).
2. Locate the **Google Gemini API Integration** card.
3. Click **Test Connection**.
4. The backend will perform a live ping to Google Gemini and display the roundtrip latency and model status.

### 4. Offline / Degraded Fallback Mode
If no Gemini API key is configured or the network is unreachable:
- The application remains **100% functional**.
- Syllabus parsing falls back instantly to the heuristic rule-based parser.
- Study plans are generated using the deterministic scheduling engine.
- Non-AI features (focus timers, calendar, analytics, backup) operate normally.

---

## Deployment Guide

### Deploying to Render / Railway / Heroku / Cloud Run

1. **Environment Variables**:
   Configure the following in your hosting provider's dashboard:
   - `GEMINI_API_KEY`: Your secret Google AI Studio key.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `PORT`: Managed by provider or `3000`.
   - `NODE_ENV`: `production`

2. **Build & Start Commands**:
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **CORS Configuration**:
   The backend serves the frontend statically on the same origin by default. If hosting the frontend on a separate CDN or domain, configure `cors` in `server/index.js` with your specific frontend origin.

---

## License

MIT License. Built for students, educators, and lifelong learners.
