# StudyPilot AI - Google Gemini API Integration Architecture

## 1. Official SDK & Model Strategy

### 1.1. Official Google Gen AI JavaScript SDK
We use the official Google Gen AI SDK:
```bash
npm install @google/genai dotenv
```
Imported and initialized exclusively on the backend:
```javascript
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });
```

### 1.2. Default Model Selection
- **Default Model**: `gemini-2.5-flash` (fast, cost-effective, excels at structured JSON and pedagogical reasoning).
- Configurable via `.env`: `GEMINI_MODEL=gemini-2.5-flash`.
- Backward-compatible with other models like `gemini-2.5-pro` when deeper analysis is desired.

---

## 2. API Endpoints

All endpoints are hosted under `/api/`:

| Endpoint | Method | Purpose | Input Payload | Output Payload |
|---|---|---|---|---|
| `/api/health` | GET | Basic server status | None | `{ status: "ok", timestamp }` |
| `/api/ai/status` | GET | Model & key availability info (no secrets leaked) | None | `{ configured: boolean, model: string }` |
| `/api/ai/test-connection` | POST | Live ping to Gemini API | None | `{ connected: boolean, message: string, latencyMs: number }` |
| `/api/ai/parse-syllabus` | POST | Convert raw syllabus text to structured topics | `{ text, subjectName }` | `{ units: [{ title, topics: [...] }] }` |
| `/api/ai/generate-study-plan`| POST | Pedagogical session generation & task advice | `{ subjects, topics, horizonDays, preferences }` | `{ sessions: [...], recommendations: [...] }` |
| `/api/ai/study-assistant` | POST | Context-aware academic tutoring & advice | `{ message, history, context: { topic, subject } }` | `{ reply: string, suggestedFollowUps: [...] }` |
| `/api/ai/recommend-revision` | POST | AI revision plan for upcoming exams | `{ subject, weakTopics, daysLeft }` | `{ revisionPlan: [...] }` |

---

## 3. Structured Outputs (JSON Schema)

Where structured output is strictly required (such as syllabus parsing and plan generation), we supply `config.responseMimeType = "application/json"` and `config.responseJsonSchema` using the SDK's `Type` definitions.

Example Schema for Syllabus Parsing:
```javascript
config: {
  responseMimeType: "application/json",
  responseJsonSchema: {
    type: Type.OBJECT,
    properties: {
      units: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ["title", "difficulty", "estimatedMinutes"]
              }
            }
          },
          required: ["title", "topics"]
        }
      }
    },
    required: ["units"]
  }
}
```

---

## 4. Error Handling & Safeguards
- **No Client Key Exposure**: The browser never sees or stores `GEMINI_API_KEY`.
- **Offline / Degraded Mode**: If `GEMINI_API_KEY` is missing or the network drops, the application falls back seamlessly to rule-based syllabus parsing and deterministic scheduling.
- **Quota & Rate Limit Defense**: Backend catches HTTP 429 errors from Google Gemini and returns clean, non-crashing HTTP 429 status codes with actionable advice ("API rate limit reached. Please wait a moment before trying again.").
- **Input Sanitization**: Request bodies are capped at 500KB to prevent memory exhaustion.
