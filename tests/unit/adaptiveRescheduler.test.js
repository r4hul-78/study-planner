import { describe, it, expect } from 'vitest';
import { generateReschedulePreview } from '../../src/js/services/reschedulerService.js';

describe('Adaptive Rescheduling Engine', () => {
  const today = '2026-10-17';

  const sampleSubjects = [
    { id: 's1', name: 'Applied Physics', examDate: '2026-10-25' }
  ];

  const sampleTopics = [
    { id: 't1', subjectId: 's1', title: 'Diffraction', difficulty: 'hard', confidence: 2 }
  ];

  const samplePreferences = {
    defaultSessionDuration: 45,
    defaultBreakDuration: 10,
    maxDailyHours: 4,
    dailyAvailability: {
      0: [{ id: 'w0', startTime: '10:00', endTime: '12:00' }],
      6: [{ id: 'w6', startTime: '10:00', endTime: '12:00' }]
    }
  };

  it('moves missed past sessions to future open slots while preserving completed records', () => {
    const sessions = [
      // Completed session in the past - MUST be preserved!
      {
        id: 'sess_done',
        subjectId: 's1',
        topicId: 't1',
        date: '2026-10-15',
        startTime: '10:00',
        endTime: '10:45',
        durationMinutes: 45,
        status: 'completed',
        locked: false
      },
      // Missed session from yesterday - MUST be rescheduled!
      {
        id: 'sess_missed',
        subjectId: 's1',
        topicId: 't1',
        date: '2026-10-16',
        startTime: '10:00',
        endTime: '10:45',
        durationMinutes: 45,
        status: 'scheduled',
        locked: false
      }
    ];

    const result = generateReschedulePreview({
      sessions,
      subjects: sampleSubjects,
      topics: sampleTopics,
      preferences: samplePreferences,
      todayStr: today
    });

    expect(result.changesCount).toBe(1);

    // Verify completed session was not modified
    const completedSession = result.updatedSessions.find(s => s.id === 'sess_done');
    expect(completedSession.date).toBe('2026-10-15');
    expect(completedSession.status).toBe('completed');

    // Verify missed session was moved to today or future date
    const rescheduledSession = result.updatedSessions.find(s => s.id === 'sess_missed');
    expect(rescheduledSession.date >= today).toBe(true);
  });

  it('strictly preserves locked sessions from being displaced', () => {
    const sessions = [
      {
        id: 'sess_locked',
        subjectId: 's1',
        topicId: 't1',
        date: '2026-10-16',
        startTime: '10:00',
        endTime: '10:45',
        durationMinutes: 45,
        status: 'scheduled',
        locked: true // locked!
      }
    ];

    const result = generateReschedulePreview({
      sessions,
      subjects: sampleSubjects,
      topics: sampleTopics,
      preferences: samplePreferences,
      todayStr: today
    });

    expect(result.changesCount).toBe(0);
    const retained = result.updatedSessions.find(s => s.id === 'sess_locked');
    expect(retained.date).toBe('2026-10-16');
  });
});
