# StudyPilot AI - System Architecture

## 1. High-Level Architecture Overview

StudyPilot AI uses a clean, decoupled **Client-Server Architecture**:

```
+-------------------------------------------------------------+
|                      STUDENT BROWSER                        |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Single Page Application (Vanilla HTML5 / CSS3 / ES6)  |  |
|  | - Router (Hash / Path SPA Router)                     |  |
|  | - State Management (Reactive Store with Listeners)     |  |
|  | - UI Pages (Dashboard, Subjects, Planner, Calendar,   |  |
|  |             Analytics, Assistant, Settings)           |  |
|  | - Client Services (StorageService, PlannerEngine,     |  |
|  |                    ProgressTracker, ApiClient)        |  |
|  +-------------------------------------------------------+  |
|                             |                               |
|        localStorage         | fetch() JSON API              |
|   (Atomic schema versioned) | (No credentials exposed)      |
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     BACKEND SERVER (Node.js)                |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Express.js REST API Server                            |  |
|  | - Static File Server (serves src/ & vendor assets)    |  |
|  | - Security Headers & Input Sanitization               |  |
|  | - Rate Limiter & Request Timeout Middleware          |  |
|  +-------------------------------------------------------+  |
|  | API Router: /api/ai/* & /api/health                   |  |
|  | - POST /api/ai/test-connection                        |  |
|  | - POST /api/ai/parse-syllabus                         |  |
|  | - POST /api/ai/generate-study-plan                    |  |
|  | - POST /api/ai/study-assistant                        |  |
|  | - POST /api/ai/recommend-revision                     |  |
|  +-------------------------------------------------------+  |
|  | Gemini Service (@google/genai SDK)                    |  |
|  | - Reads GEMINI_API_KEY from environment               |  |
|  | - Structured JSON Output (responseJsonSchema)         |  |
|  | - Error Normalization & Timeout Handling              |  |
|  +-------------------------------------------------------+  |
+-----------------------------+-------------------------------+
                              |
                              v HTTPS
+-------------------------------------------------------------+
|                     GOOGLE GEMINI API                       |
|          gemini-2.5-flash / gemini-2.5-pro                  |
+-------------------------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1. Frontend Modules (`src/`)
- `index.html`: Shell host with semantic layout, meta viewport, font links, and modal containers.
- `src/css/`:
  - `variables.css`: Design tokens (colors, spacing, elevations, radii, typography, light/dark overrides).
  - `base.css`: CSS reset, typography, scrollbar styling, utility classes.
  - `layout.css`: Sidebar, header, navigation container, main grid.
  - `components.css`: Buttons, cards, badges, modal dialogs, timers, forms, alerts, charts.
  - `pages.css`: Specific view layouts (Dashboard cards, Calendar grid, Chat feed).
  - `responsive.css`: Breakpoints for 640px, 768px, 1024px, 1280px.
- `src/js/`:
  - `app.js`: Application bootstrap, event wiring, and initial state hydration.
  - `router.js`: Dynamic client-side view switching without page reloads.
  - `state/store.js`: Centralized reactive state store supporting subscriptions, state diffing, and localStorage auto-sync.
  - `services/`:
    - `storageService.js`: localStorage wrapper with schema migrations (v1.0.0), JSON import/export, and backup integrity checks.
    - `plannerEngine.js`: Deterministic core for prioritizing topics, allocating time windows, scheduling breaks, and resolving study conflicts.
    - `progressService.js`: Computes syllabus coverage, readiness scores, and study streak statistics.
    - `apiClient.js`: Communication bridge to backend `/api/` endpoints with timeout, error translation, and offline fallback.
  - `pages/`:
    - `dashboardPage.js`: Today's roadmap, exam countdowns, metrics overview, smart recommendations.
    - `subjectsPage.js`: Subject cards, unit/topic breakdown, syllabus text import with rule/AI parser preview.
    - `plannerPage.js`: Plan generator wizard, daily schedule timeline, focus timer modal.
    - `calendarPage.js`: Month/Week/Agenda views with status colors and filtering.
    - `analyticsPage.js`: Interactive Chart.js graphs, weak-topic diagnosis, and exam readiness report.
    - `assistantPage.js`: Gemini-powered conversational study companion.
    - `settingsPage.js`: Availability editor, theme toggle, API health tester, backup & restore.

### 2.2. Backend Modules (`server/`)
- `server/index.js`: Express server initialization, middleware binding, error handler, and server start.
- `server/routes/aiRoutes.js`: Exposes REST endpoints for syllabus parsing, plan synthesis, tutoring assistant, and connectivity validation.
- `server/services/geminiService.js`: Encapsulates Google Gen AI SDK (`@google/genai`), handles model configuration, prompt engineering, structured JSON responses, and exponential backoff retry.
- `server/middleware/`:
  - `errorHandler.js`: Formats API errors into standard JSON `{ error: { code, message, details } }`.
  - `rateLimiter.js`: Protects AI endpoints from runaway usage.

---

## 3. Data Flow

### 3.1. Syllabus Parsing Pipeline
1. User pastes raw syllabus text into the Subject modal.
2. User chooses "AI Parsing" or "Quick Rule-Based Parsing".
3. If AI Parsing:
   - Frontend calls `POST /api/ai/parse-syllabus` with `{ text, subjectName }`.
   - Backend constructs a system-prompted JSON schema query to Gemini.
   - Gemini returns structured `{ units: [{ title, topics: [{ title, estimatedMinutes, difficulty }] }] }`.
   - Backend validates structure and returns JSON to frontend.
4. If AI fails or user selects Rule-Based:
   - Frontend heuristic parser processes outline indentation and bullets.
5. Editable preview modal displays extracted topics.
6. User reviews, adjusts, and confirms save into `localStorage`.

### 3.2. Hybrid Study Plan Generation Pipeline
1. Student triggers "Generate New Study Plan" selecting date range (e.g. Next 7 Days).
2. Frontend evaluates:
   - Available study windows from user profile.
   - Uncompleted topics across active subjects.
   - Priority scores calculated deterministically:
     - Exam urgency + Topic importance + Difficulty + (5 - Confidence).
3. Frontend requests AI strategy optimization from `POST /api/ai/generate-study-plan` (session goals, revision frequency, study methodology).
4. Deterministic Scheduler reconciles AI recommendations with concrete availability slots:
   - Caps daily study at max study hours.
   - Inserts break intervals.
   - Allocates topics strictly before their subject's examination date.
   - Detects over-capacity condition (if syllabus hours > available hours).
5. User reviews plan preview (total hours, daily breakdown, conflicts).
6. On user confirmation, new `studyPlan` and `studySessions` are committed to store.
