# StudyPilot AI - Product Requirements Document (PRD)

## 1. Executive Summary
**StudyPilot AI** is an intelligent, personalized academic planning and study companion that transforms a student's unstructured syllabus, subjects, upcoming examinations, time constraints, and progress into a realistic, actionable, and dynamically adjustable study schedule.

### Tagline
*"Your syllabus. Your strategy. Your success."*

### Core Value Proposition
Traditional study planners are either rigid static calendars or disconnected AI chatbots that hallucinate unrealistic schedules. StudyPilot AI merges **deterministic algorithmic scheduling** (strict time windows, break allocation, conflict detection, capacity limits) with **Google Gemini generative intelligence** (syllabus decomposition, pedagogy recommendations, adaptive study strategies, and contextual conceptual tutoring).

---

## 2. Target Audience & Personas
- **High School & Competitive Exam Students**: Preparing for standardized exams (e.g., SAT, AP, JEE, NEET, GCSE, A-Levels) with massive syllabi and strict deadlines.
- **University Undergraduate & Graduate Students**: Balancing coursework, midterms, finals, and project deadlines across diverse subjects.
- **Self-Directed Learners & Professional Certification Candidates**: Studying for certifications (e.g., AWS, PMP, CPA) with variable daily schedules.

---

## 3. Product Features & Scope

### 3.1. Onboarding & Student Profile
- User display name, academic level (High School, Undergraduate, Graduate, Certification).
- Weekly availability schedule with **multi-window daily time ranges** (e.g., Morning 06:00-08:00, Evening 18:00-21:00).
- Configurable study habits: default session duration (e.g., 45 mins), break duration (e.g., 10 mins), max daily hours (e.g., 6 hours).
- Skippable, resumable, and fully editable at any time.

### 3.2. Subject & Syllabus Management
- Subject entities with color palettes, priority levels (1-5), exam dates, and targets.
- Hierarchical topic structure (Units -> Topics -> Subtopics).
- Topic metadata: difficulty (Easy, Medium, Hard), estimated study time, priority weight, status (Not Started, In Progress, Completed, Needs Revision), confidence level (1-5), and dependencies.
- Dual-mode syllabus ingestion:
  1. **Deterministic Rule-Based Parser**: Fast offline parsing of structured outline text.
  2. **Gemini AI-Powered Parser**: Intelligent extraction of unstructured course syllabi into clean hierarchical JSON with topics, estimated durations, and difficulty levels.
- Interactive syllabus preview & confirmation modal before storing.

### 3.3. Hybrid Intelligent Study Planner Engine
- **Transparent Priority Scoring Algorithm**:
  $$\text{Priority Score} = w_{\text{urgency}} \times U + w_{\text{importance}} \times I + w_{\text{difficulty}} \times D + w_{\text{confidence}} \times (5 - C) + w_{\text{dependency}} \times Dep$$
- **Deterministic Scheduling Logic**:
  - Respects student availability windows without overbooking.
  - Enforces session lengths and mandatory breaks (Pomodoro or custom intervals).
  - Enforces daily capacity limits.
  - Prevents overlap and excludes completed topics.
  - Schedules revision blocks ahead of exam dates.
  - Halts new learning past the subject exam date.
  - Honest capacity detection: if syllabus hours exceed available hours, flags an over-capacity warning and proposes a prioritized triage plan.
- **Gemini AI Guidance**:
  - Recommends pedagogical sequencing, session objectives, and focused study activities.

### 3.4. Adaptive Rescheduling & Tracking
- Study session execution: Live timer, pause, complete, record actual minutes, rate post-session confidence (1-5), and progress notes.
- Incomplete/missed session detection:
  - Preserves completed learning records.
  - Re-allocates unfinished tasks into future available slots.
  - Locks protected sessions from displacement.
  - Change-impact preview before confirmation.

### 3.5. Interactive Calendar & Planner Views
- **Day View**: Detailed timeline with active session triggers and focus countdown.
- **Week View**: Workload distribution across the 7-day horizon.
- **Agenda / List View**: Clean, mobile-friendly searchable list of all study blocks.
- Filter by Subject, Task Type (Learning, Revision, Practice, Mock Exam), and Status.

### 3.6. Contextual AI Study Assistant
- Multi-turn educational companion powered by Gemini API.
- Direct quick prompts: "What should I study today?", "Explain topic in simple terms", "Generate practice quiz", "Revise weak areas".
- Context-conscious: Injects only current topic context, recent confidence ratings, and exam timeline without exposing sensitive personal info.

### 3.7. Progress & Analytics Dashboard
- Overall & subject-wise syllabus coverage metrics.
- Planned vs. Actual study time tracking.
- Weekly study velocity chart.
- Exam readiness indicator with transparent evidence-based breakdown.
- Weak topic radar based on low confidence ratings, repeated revisions, and pending high-difficulty tasks.

### 3.8. Settings, Themes & Data Portability
- Dark (default) and Light themes with fluid transitions and `prefers-reduced-motion` compliance.
- Live Gemini API health check and status tester.
- Atomic JSON data export and import with schema migration, checksum, and validation.
- Reset workspace with double-confirmation modal.

---

## 4. Success Criteria & Non-Functional Requirements
- **Performance**: Instant client-side state interactions (< 50ms) using vanilla ES modules.
- **Reliability**: Graceful offline fallback; full planner functionality works locally even if Gemini API key is unset or unreachable.
- **Security**: Zero browser leakage of Gemini API keys. Backend REST gateway strictly sanitizes inputs and throttles requests.
- **Responsiveness**: Flawless experience from 320px mobile screens to 4K ultra-wide monitors.
