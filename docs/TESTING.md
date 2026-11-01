# StudyPilot AI - Automated Testing Plan

## 1. Testing Framework
We use **Vitest** for running unit and integration tests. Vitest provides native ES module support, high speed, and zero configuration overhead for Node.js environments.

---

## 2. Test Suite Structure

```
tests/
├── unit/
│   ├── priorityAlgorithm.test.js      # Verifies formula: urgency, importance, difficulty, confidence
│   ├── timeWindowUtils.test.js        # Validates slot allocation, break insertion, overlap prevention
│   ├── deterministicScheduler.test.js # Exam deadlines, capacity overload detection, prerequisites
│   ├── ruleBasedParser.test.js        # Heuristic syllabus text extraction
│   ├── progressCalculator.test.js     # Completion %, streak, readiness metrics
│   ├── storageMigration.test.js       # localStorage schema migration and JSON validation
│   └── adaptiveRescheduler.test.js    # Unfinished task relocation, locked session preservation
├── integration/
│   ├── aiRoutes.test.js               # Backend Express endpoints with mocked Gemini responses
│   └── healthRoutes.test.js           # Server health & status endpoint checks
└── fixtures/
    ├── sampleSyllabus.txt             # Realistic syllabus test fixture
    └── sampleBackup.json              # Valid exported user data for backup tests
```

---

## 3. Mandatory Scenarios Coverage Checklist

1. [x] Priority calculation correctly ranks urgent, low-confidence, high-difficulty topics.
2. [x] Schedule allocator strictly prevents overlapping sessions.
3. [x] Daily availability windows and max study hours are respected.
4. [x] No sessions scheduled after a subject's exam date.
5. [x] Break periods are automatically inserted between continuous study blocks.
6. [x] Completed topics are excluded from newly generated study plans.
7. [x] Impossible workloads (e.g. 50 hours of content in 10 hours of available time) trigger capacity alert.
8. [x] Missed tasks can be rescheduled without creating duplicate entries.
9. [x] Completed sessions and progress history are preserved during rescheduling.
10. [x] Locked sessions cannot be displaced by automated rescheduling.
11. [x] Rule-based syllabus parser extracts units and topics accurately.
12. [x] Backup export produces valid JSON; import rejects corrupted/schema-invalid JSON.
13. [x] Backend gracefully handles missing or invalid `GEMINI_API_KEY` without crashing.
14. [x] API outputs match defined JSON schema contracts.
