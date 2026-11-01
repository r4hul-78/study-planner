import { describe, it, expect } from 'vitest';
import { calculateProgressMetrics, calculateExamReadiness } from '../../src/js/services/progressService.js';

describe('Progress and Analytics Engine', () => {
  const sampleSubjects = [
    { id: 's1', name: 'Physics', examDate: '2026-10-25' }
  ];

  const sampleTopics = [
    { id: 't1', subjectId: 's1', title: 'Topic 1', status: 'completed', confidence: 5 },
    { id: 't2', subjectId: 's1', title: 'Topic 2', status: 'completed', confidence: 4 },
    { id: 't3', subjectId: 's1', title: 'Topic 3', status: 'in_progress', confidence: 2 },
    { id: 't4', subjectId: 's1', title: 'Topic 4', status: 'needs_revision', confidence: 1 }
  ];

  const sampleProgress = [
    { id: 'p1', plannedMinutes: 45, actualMinutes: 50, confidence: 5 },
    { id: 'p2', plannedMinutes: 45, actualMinutes: 45, confidence: 4 }
  ];

  it('calculates syllabus completion percentage correctly', () => {
    const metrics = calculateProgressMetrics({
      subjects: sampleSubjects,
      topics: sampleTopics,
      sessions: [],
      progress: sampleProgress
    });

    // 2 completed out of 4 total = 50%
    expect(metrics.overallCompletionPercentage).toBe(50);
    expect(metrics.totalStudyHours).toBe('1.6'); // 95 actual minutes = ~1.6h
  });

  it('identifies weak topics requiring revision or practice', () => {
    const metrics = calculateProgressMetrics({
      subjects: sampleSubjects,
      topics: sampleTopics,
      sessions: [],
      progress: sampleProgress
    });

    // Topic 3 (confidence 2) and Topic 4 (confidence 1, needs_revision)
    expect(metrics.weakTopics.length).toBe(2);
    expect(metrics.weakTopics[0].id).toBe('t4'); // lowest confidence first
  });

  it('protects against insufficient data with explicit status safeguard', () => {
    const readiness = calculateExamReadiness({
      subjects: sampleSubjects,
      topics: [{ id: 't1', status: 'not_started' }], // only 1 topic
      progress: []
    });

    expect(readiness.status).toBe('insufficient_data');
    expect(readiness.label).toBe('Insufficient Data');
  });

  it('computes transparent readiness score when sufficient data is present', () => {
    const readiness = calculateExamReadiness({
      subjects: sampleSubjects,
      topics: sampleTopics,
      progress: sampleProgress
    });

    expect(readiness.status).toBe('calculated');
    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(readiness.factors.coverageRatio).toBe(50);
  });
});
