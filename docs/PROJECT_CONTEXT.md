# StudyPilot AI - Project Context & Execution Log

## 1. Project Overview

- **Product**: StudyPilot AI
- **Tagline**: "Your syllabus. Your strategy. Your success."
- **Stack**: Vanilla HTML5/CSS3/ES6 Modules Frontend, Express.js Backend, `@google/genai` Official SDK, `vitest` Testing Suite.
- **Data Persistence**: Browser `localStorage` with versioned schema (`studypilot_data_v1`) + JSON export/import.
- **Current State**: Phase 0 completed (PRD, Architecture, Data Model, AI Integration, Testing Plan, Project Context).

## 2. Phase Execution Roadmap

- [x] **Phase 0 — Inspect and plan** (Completed)
- [ ] **Phase 1 — Foundation and UI** (Project scaffolding, package.json, Express server, responsive CSS layout, router, state store, onboarding)
- [ ] **Phase 2 — Subjects and syllabus** (CRUD for subjects, topics, syllabus text importer, rule-based & AI parsers)
- [ ] **Phase 3 — Scheduling engine** (Deterministic priority engine, availability slot matcher, capacity detection, break handling)
- [ ] **Phase 4 — Planner and task tracking** (Interactive timeline, focus timer modal, task progress recorder)
- [ ] **Phase 5 — Gemini integration** (`@google/genai` backend service, connection tester, syllabus parsing, study assistant)
- [ ] **Phase 6 — Dashboard and analytics** (Charts, countdowns, weak topic diagnosis, readiness score)
- [ ] **Phase 7 — Polish and hardening** (Export/import backup, themes, accessibility, mobile layout check)
- [ ] **Phase 8 — Final verification and handover** (Full test execution, README.md, live verification)

## 3. Assumptions & Guardrails

- `GEMINI_API_KEY` is safely kept in `.env` and never transferred to frontend.
- Fallback deterministic planners and parsers are provided so application is 100% functional even without a configured Gemini key.
- Local timezones are handled cleanly without UTC string mutation bugs.
