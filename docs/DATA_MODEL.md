# StudyPilot AI - Data Model Specification

## 1. Schema Version: `1.0.0`

The data model is stored under the `studypilot_data_v1` key in `localStorage`. All entities use UUID v4 strings for unique identification.

---

## 2. Entities & Interfaces

### 2.1. StudentProfile

```typescript
interface StudentProfile {
  id: string;                    // UUID
  displayName: string;           // e.g. "Aditya Raj"
  academicLevel: string;         // "high_school" | "undergraduate" | "graduate" | "certification" | "self_study"
  course: string;                // e.g. "Computer Science & Engineering"
  semesterOrYear?: string;       // e.g. "Semester 4"
  preferences: StudyPreferences;
  createdAt: string;             // ISO8601
  updatedAt: string;             // ISO8601
}

interface StudyPreferences {
  defaultSessionDuration: number;// in minutes, e.g. 45
  defaultBreakDuration: number;  // in minutes, e.g. 10
  maxDailyHours: number;         // e.g. 6
  preferredDays: number[];       // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday)
  dailyAvailability: {           // Per-day time windows
    [dayOfWeek: number]: TimeWindow[];
  };
  defaultPlanHorizonDays: number;// 7 | 14 | 30
  revisionRatio: number;         // 0.2 (20% of study time reserved for revision)
}

interface TimeWindow {
  id: string;
  startTime: string;             // "09:00" (24-hour HH:mm)
  endTime: string;               // "12:00"
}
```

### 2.2. Subject

```typescript
interface Subject {
  id: string;                    // UUID
  name: string;                  // e.g. "Applied Physics"
  description?: string;
  color: string;                 // Hex or HSL color code e.g. "#10B981"
  examDate?: string;             // "YYYY-MM-DD"
  importance: number;            // 1 (low) to 5 (critical)
  preparationLevel: number;      // 1 to 5 (estimated current preparedness)
  archived: boolean;             // Default false
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3. Topic

```typescript
interface Topic {
  id: string;                    // UUID
  subjectId: string;             // Foreign Key -> Subject.id
  unitTitle?: string;            // e.g. "Unit 1: Electromagnetism"
  title: string;                 // e.g. "Maxwell's Equations"
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  importance: number;            // 1 to 5
  estimatedMinutes: number;      // e.g. 60
  status: "not_started" | "in_progress" | "completed" | "needs_revision";
  confidence: number;            // 1 (no clue) to 5 (mastered)
  dependencies?: string[];       // Array of Topic.id that must precede this
  notes?: string;
  order: number;                 // Sort position in unit
  createdAt: string;
  updatedAt: string;
}
```

### 2.4. StudyPlan

```typescript
interface StudyPlan {
  id: string;                    // UUID
  name: string;                  // e.g. "Finals Sprint - Week 1"
  startDate: string;             // "YYYY-MM-DD"
  endDate: string;               // "YYYY-MM-DD"
  status: "active" | "completed" | "archived";
  configuration: {
    selectedSubjectIds: string[];
    priorityExamId?: string;
    totalAvailableMinutes: number;
    totalAllocatedMinutes: number;
    isOverCapacity: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 2.5. StudySession

```typescript
interface StudySession {
  id: string;                    // UUID
  planId: string;                // Foreign Key -> StudyPlan.id
  subjectId: string;             // Foreign Key -> Subject.id
  topicId: string;               // Foreign Key -> Topic.id
  date: string;                  // "YYYY-MM-DD" (Local date)
  startTime: string;             // "HH:mm" e.g. "10:00"
  endTime: string;               // "HH:mm" e.g. "10:45"
  durationMinutes: number;       // e.g. 45
  taskType: "learning" | "revision" | "practice" | "mock_exam" | "error_analysis";
  priority: number;              // Calculated priority score
  objective: string;             // Actionable goal for this session
  suggestedActivities?: string[];// ["Read section 3.1", "Derive Gauss's Law", "Attempt 2 problems"]
  completionCriteria: string;    // "Solve 3 practice problems without notes"
  status: "scheduled" | "in_progress" | "completed" | "skipped" | "missed";
  locked: boolean;               // If true, scheduler will not relocate during auto-rescheduling
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.6. ProgressRecord

```typescript
interface ProgressRecord {
  id: string;                    // UUID
  sessionId?: string;            // Link to StudySession if generated from session
  subjectId: string;             // Foreign Key -> Subject.id
  topicId: string;               // Foreign Key -> Topic.id
  plannedMinutes: number;
  actualMinutes: number;
  completionStatus: "completed" | "partial" | "skipped";
  confidence: number;            // 1 to 5 reported after session
  notes?: string;
  completedAt: string;           // ISO8601 timestamp
}
```

### 2.7. AppSettings

```typescript
interface AppSettings {
  theme: "dark" | "light" | "system";
  geminiModel: string;           // e.g. "gemini-2.5-flash"
  enableAiFeatures: boolean;
  storageSchemaVersion: string;  // "1.0.0"
}
```

---

## 3. Storage Integrity & Migration Rules

1. **Atomic Import**: When a backup JSON is imported, the complete payload is verified against schema validators before modifying `localStorage`.
2. **Schema Versioning**: Stored data includes `schemaVersion`. If the format changes in future releases, migration handlers execute sequentially (`migrate_v1_to_v2`, etc.).
3. **Cascading Safety**: Deleting a subject prompts user with impact analysis (number of associated topics and future sessions to be unlinked/deleted).
