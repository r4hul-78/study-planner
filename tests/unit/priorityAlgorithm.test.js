import { describe, it, expect } from 'vitest';
import { calculateTopicPriority, DEFAULT_WEIGHTS } from '../../src/js/services/plannerEngine.js';

describe('Priority Scoring Algorithm', () => {
  const today = '2026-10-17';

  it('assigns high priority to topics with approaching exam, low confidence, and high difficulty', () => {
    const topic = {
      id: 't1',
      title: 'Schrödinger Wave Equation',
      difficulty: 'hard',
      importance: 5,
      confidence: 1, // lowest confidence
      status: 'needs_revision'
    };

    const subject = {
      id: 's1',
      name: 'Applied Physics',
      examDate: '2026-10-20', // in 3 days!
      importance: 5
    };

    const score = calculateTopicPriority(topic, subject, today);
    expect(score).toBeGreaterThan(80);
  });

  it('assigns lower priority to mastered easy topics with distant exams', () => {
    const topic = {
      id: 't2',
      title: 'Introduction to Units',
      difficulty: 'easy',
      importance: 2,
      confidence: 5, // mastered
      status: 'completed'
    };

    const subject = {
      id: 's2',
      name: 'General Science',
      examDate: '2026-12-15', // 2 months away
      importance: 2
    };

    const score = calculateTopicPriority(topic, subject, today);
    expect(score).toBeLessThan(40);
  });

  it('ranks difficult low-confidence topics higher than easy high-confidence topics within the same subject', () => {
    const subject = { id: 's1', examDate: '2026-11-01', importance: 4 };

    const topicHardLowConf = {
      id: 't1',
      difficulty: 'hard',
      importance: 5,
      confidence: 2,
      status: 'in_progress'
    };

    const topicEasyHighConf = {
      id: 't2',
      difficulty: 'easy',
      importance: 3,
      confidence: 5,
      status: 'not_started'
    };

    const score1 = calculateTopicPriority(topicHardLowConf, subject, today);
    const score2 = calculateTopicPriority(topicEasyHighConf, subject, today);

    expect(score1).toBeGreaterThan(score2);
  });
});
