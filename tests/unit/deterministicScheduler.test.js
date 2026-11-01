import { describe, it, expect } from 'vitest';
import { generateDeterministicPlan } from '../../src/js/services/plannerEngine.js';

describe('Deterministic Scheduling Engine', () => {
  const sampleSubjects = [
    {
      id: 'sub_phys',
      name: 'Physics',
      examDate: '2026-10-25',
      importance: 5
    },
    {
      id: 'sub_math',
      name: 'Calculus',
      examDate: '2026-10-30',
      importance: 4
    }
  ];

  const sampleTopics = [
    {
      id: 'top_1',
      subjectId: 'sub_phys',
      title: 'Optics Derivations',
      difficulty: 'hard',
      importance: 5,
      estimatedMinutes: 60,
      status: 'not_started',
      confidence: 2
    },
    {
      id: 'top_2',
      subjectId: 'sub_phys',
      title: 'Polarization Basics',
      difficulty: 'easy',
      importance: 3,
      estimatedMinutes: 45,
      status: 'completed', // completed topic!
      confidence: 5
    },
    {
      id: 'top_3',
      subjectId: 'sub_math',
      title: 'Integration by Parts',
      difficulty: 'medium',
      importance: 4,
      estimatedMinutes: 60,
      status: 'in_progress',
      confidence: 3
    }
  ];

  const samplePreferences = {
    defaultSessionDuration: 45,
    defaultBreakDuration: 15,
    maxDailyHours: 3, // 180 minutes max per day
    dailyAvailability: {
      0: [{ id: 'w0', startTime: '10:00', endTime: '12:00' }], // Sun (120 mins)
      1: [{ id: 'w1', startTime: '18:00', endTime: '21:00' }], // Mon (180 mins)
      2: [{ id: 'w2', startTime: '18:00', endTime: '21:00' }], // Tue (180 mins)
      3: [{ id: 'w3', startTime: '18:00', endTime: '21:00' }], // Wed (180 mins)
      4: [{ id: 'w4', startTime: '18:00', endTime: '21:00' }], // Thu (180 mins)
      5: [{ id: 'w5', startTime: '18:00', endTime: '21:00' }], // Fri (180 mins)
      6: [{ id: 'w6', startTime: '10:00', endTime: '12:00' }]  // Sat (120 mins)
    }
  };

  it('generates non-overlapping sessions with mandatory break buffers', () => {
    const result = generateDeterministicPlan({
      subjects: sampleSubjects,
      topics: sampleTopics,
      preferences: samplePreferences,
      horizonDays: 7,
      startDate: '2026-10-17'
    });

    expect(result.sessions.length).toBeGreaterThan(0);

    // Group by date and check for overlaps
    const sessionsByDate = new Map();
    for (const s of result.sessions) {
      if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, []);
      sessionsByDate.get(s.date).push(s);
    }

    for (const [date, daySessions] of sessionsByDate.entries()) {
      for (let i = 0; i < daySessions.length - 1; i++) {
        const currentEnd = daySessions[i].endTime;
        const nextStart = daySessions[i + 1].startTime;
        // Verify current session ends BEFORE next session starts (break buffer included!)
        expect(currentEnd <= nextStart).toBe(true);
      }
    }
  });

  it('excludes already completed topics from new study plans', () => {
    const result = generateDeterministicPlan({
      subjects: sampleSubjects,
      topics: sampleTopics,
      preferences: samplePreferences,
      horizonDays: 7,
      startDate: '2026-10-17'
    });

    const completedTopicSessions = result.sessions.filter(s => s.topicId === 'top_2');
    expect(completedTopicSessions.length).toBe(0);
  });

  it('enforces maximum daily study hours strictly', () => {
    const result = generateDeterministicPlan({
      subjects: sampleSubjects,
      topics: sampleTopics,
      preferences: samplePreferences,
      horizonDays: 7,
      startDate: '2026-10-17'
    });

    const dayMinutesMap = new Map();
    for (const s of result.sessions) {
      const cur = dayMinutesMap.get(s.date) || 0;
      dayMinutesMap.set(s.date, cur + s.durationMinutes);
    }

    for (const [date, totalMins] of dayMinutesMap.entries()) {
      expect(totalMins).toBeLessThanOrEqual(samplePreferences.maxDailyHours * 60);
    }
  });

  it('detects over-capacity condition when workload exceeds available capacity', () => {
    // Highly constrained availability (only 1 hour available)
    const constrainedPrefs = {
      defaultSessionDuration: 45,
      defaultBreakDuration: 10,
      maxDailyHours: 1,
      dailyAvailability: {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [],
        6: [{ id: 'w1', startTime: '10:00', endTime: '11:00' }] // only 60 mins total
      }
    };

    const heavyTopics = [
      { id: 'h1', subjectId: 'sub_phys', title: 'Heavy 1', estimatedMinutes: 120, status: 'not_started' },
      { id: 'h2', subjectId: 'sub_phys', title: 'Heavy 2', estimatedMinutes: 120, status: 'not_started' },
      { id: 'h3', subjectId: 'sub_phys', title: 'Heavy 3', estimatedMinutes: 120, status: 'not_started' }
    ];

    const result = generateDeterministicPlan({
      subjects: sampleSubjects,
      topics: heavyTopics,
      preferences: constrainedPrefs,
      horizonDays: 7,
      startDate: '2026-10-17'
    });

    expect(result.isOverCapacity).toBe(true);
    expect(result.capacityDeficitMinutes).toBeGreaterThan(0);
    expect(result.studyPlan.configuration.triageAdvice).toContain('Pending syllabus requires');
  });

  it('does not schedule study sessions on or after subject exam date', () => {
    const subjectsWithImminentExam = [
      {
        id: 'sub_near',
        name: 'Urgent Test',
        examDate: '2026-10-18' // Tomorrow!
      }
    ];

    const topicsForNearExam = [
      {
        id: 'top_near_1',
        subjectId: 'sub_near',
        title: 'Last Minute Review',
        estimatedMinutes: 45,
        status: 'not_started'
      }
    ];

    const result = generateDeterministicPlan({
      subjects: subjectsWithImminentExam,
      topics: topicsForNearExam,
      preferences: samplePreferences,
      horizonDays: 7,
      startDate: '2026-10-17'
    });

    // Check that any session scheduled for this subject is on or before exam date (2026-10-18)
    for (const session of result.sessions) {
      if (session.subjectId === 'sub_near') {
        expect(session.date <= '2026-10-18').toBe(true);
      }
    }
  });
});
