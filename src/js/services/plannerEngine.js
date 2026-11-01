import { generateId } from '../utils/idGenerator.js';
import {
  getTodayString,
  addDays,
  daysBetween,
  getDayOfWeek,
  timeToMinutes,
  minutesToTime
} from '../utils/dateUtils.js';

export const DEFAULT_WEIGHTS = {
  urgency: 0.35,
  importance: 0.20,
  difficulty: 0.15,
  confidence: 0.20,
  status: 0.10
};

/**
 * Calculates a transparent, normalized priority score (0 to 100) for a topic.
 */
export function calculateTopicPriority(topic, subject, todayStr = getTodayString(), weights = DEFAULT_WEIGHTS) {
  // 1. Examination Urgency (0 - 100)
  let urgencyScore = 20;
  if (subject && subject.examDate) {
    const daysUntilExam = daysBetween(todayStr, subject.examDate);
    if (daysUntilExam <= 0) {
      urgencyScore = 100; // Exam is today or immediate
    } else if (daysUntilExam <= 3) {
      urgencyScore = 95;
    } else if (daysUntilExam <= 7) {
      urgencyScore = 80;
    } else if (daysUntilExam <= 14) {
      urgencyScore = 65;
    } else if (daysUntilExam <= 30) {
      urgencyScore = 45;
    } else {
      urgencyScore = 25;
    }
  }

  // 2. Topic / Subject Importance (0 - 100)
  const importanceLevel = topic.importance || subject?.importance || 3;
  const importanceScore = Math.min(100, Math.max(0, (importanceLevel / 5) * 100));

  // 3. Topic Difficulty (0 - 100)
  let difficultyScore = 50;
  if (topic.difficulty === 'hard') difficultyScore = 90;
  else if (topic.difficulty === 'medium') difficultyScore = 60;
  else if (topic.difficulty === 'easy') difficultyScore = 30;

  // 4. Low Confidence Deficit (0 - 100)
  // Confidence 1 (lowest) -> 100; Confidence 5 (highest) -> 0
  const confidence = topic.confidence || 3;
  const confidenceScore = Math.min(100, Math.max(0, (5 - confidence) * 25));

  // 5. Preparation Status (0 - 100)
  let statusScore = 50;
  if (topic.status === 'needs_revision') statusScore = 90;
  else if (topic.status === 'in_progress') statusScore = 75;
  else if (topic.status === 'not_started') statusScore = 50;
  else if (topic.status === 'completed') statusScore = 0;

  const totalScore = (
    weights.urgency * urgencyScore +
    weights.importance * importanceScore +
    weights.difficulty * difficultyScore +
    weights.confidence * confidenceScore +
    weights.status * statusScore
  );

  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

/**
 * Deterministic schedule allocator.
 * Matches prioritized study tasks into student availability windows without overlapping,
 * inserting break buffers, respecting daily study limits, and preventing study after exam dates.
 */
export function generateDeterministicPlan({
  subjects = [],
  topics = [],
  preferences = {},
  horizonDays = 7,
  startDate = getTodayString(),
  existingSessions = []
}) {
  const sessionDuration = preferences.defaultSessionDuration || 45;
  const breakDuration = preferences.defaultBreakDuration || 10;
  const maxDailyMinutes = (preferences.maxDailyHours || 5) * 60;
  const dailyAvailability = preferences.dailyAvailability || {};

  // Build quick lookup maps
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  // Filter pending topics (exclude already completed topics from new learning)
  const pendingTopics = topics.filter(t => t.status !== 'completed' || t.status === 'needs_revision');

  // Score and sort topics by priority descending
  const scoredTopics = pendingTopics.map(topic => {
    const subject = subjectMap.get(topic.subjectId);
    const priority = calculateTopicPriority(topic, subject, startDate);
    return {
      topic,
      subject,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);

  // Calculate total pending study minutes
  const totalPendingMinutes = scoredTopics.reduce((acc, item) => acc + (item.topic.estimatedMinutes || sessionDuration), 0);

  // Plan container
  const planId = generateId();
  const endDate = addDays(startDate, horizonDays - 1);
  const newSessions = [];

  let totalAvailableMinutes = 0;
  let totalAllocatedMinutes = 0;

  // Track scheduled topic counts to avoid back-to-back duplicate topics on the same day
  const topicScheduledCount = new Map();

  // Iterate through each day in the horizon
  for (let dayOffset = 0; dayOffset < horizonDays; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dayOfWeek = getDayOfWeek(currentDate);
    const windowsForDay = dailyAvailability[dayOfWeek] || [];

    // Track total study time allocated for this specific day
    let dailyAllocatedMinutes = 0;

    // Check existing locked sessions for this date to avoid overlaps
    const existingDateSessions = existingSessions.filter(s => s.date === currentDate);
    for (const exs of existingDateSessions) {
      dailyAllocatedMinutes += exs.durationMinutes || 0;
    }

    for (const window of windowsForDay) {
      const windowStart = timeToMinutes(window.startTime);
      const windowEnd = timeToMinutes(window.endTime);
      const windowCapacity = Math.max(0, windowEnd - windowStart);
      totalAvailableMinutes += windowCapacity;

      let currentTime = windowStart;

      while (currentTime + sessionDuration <= windowEnd && dailyAllocatedMinutes + sessionDuration <= maxDailyMinutes) {
        // Find the best next topic eligible for this date
        const candidateIndex = scoredTopics.findIndex(({ topic, subject }) => {
          // Rule 1: Check exam date constraint - do not schedule if exam has passed
          if (subject && subject.examDate) {
            const daysLeft = daysBetween(currentDate, subject.examDate);
            if (daysLeft < 0) return false; // Exam already passed!
          }

          // Rule 2: Check prerequisites if any
          if (topic.dependencies && topic.dependencies.length > 0) {
            const hasUnmetPrereq = topic.dependencies.some(depId => {
              const depTopic = topics.find(t => t.id === depId);
              return depTopic && depTopic.status !== 'completed';
            });
            if (hasUnmetPrereq) return false;
          }

          // Rule 3: Avoid over-scheduling the same topic more than 2 times in a single week
          const count = topicScheduledCount.get(topic.id) || 0;
          const topicNeededMinutes = topic.estimatedMinutes || sessionDuration;
          if (count * sessionDuration >= topicNeededMinutes && count >= 1) {
            return false;
          }

          return true;
        });

        if (candidateIndex === -1) {
          // No more eligible topics
          break;
        }

        const candidate = scoredTopics[candidateIndex];
        const { topic, subject, priority } = candidate;

        // Check if revision block is warranted (near exam or low confidence)
        const daysUntilExam = subject?.examDate ? daysBetween(currentDate, subject.examDate) : 999;
        let taskType = 'learning';
        if (topic.status === 'needs_revision' || topic.confidence <= 2) {
          taskType = 'revision';
        } else if (daysUntilExam <= 3) {
          taskType = 'practice';
        }

        const startTimeStr = minutesToTime(currentTime);
        const endTimeStr = minutesToTime(currentTime + sessionDuration);

        // Build rich session entity
        const session = {
          id: generateId(),
          planId,
          subjectId: topic.subjectId,
          topicId: topic.id,
          date: currentDate,
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes: sessionDuration,
          taskType,
          priority,
          objective: buildSessionObjective(topic, taskType),
          suggestedActivities: buildSuggestedActivities(topic, taskType),
          completionCriteria: buildCompletionCriteria(topic, taskType),
          status: 'scheduled',
          locked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        newSessions.push(session);
        dailyAllocatedMinutes += sessionDuration;
        totalAllocatedMinutes += sessionDuration;

        // Update tracking count
        const count = topicScheduledCount.get(topic.id) || 0;
        topicScheduledCount.set(topic.id, count + 1);

        // Advance current time by session duration plus mandatory break buffer
        currentTime += sessionDuration + breakDuration;

        // If topic study requirement is satisfied, remove from candidate pool
        if ((count + 1) * sessionDuration >= (topic.estimatedMinutes || sessionDuration)) {
          scoredTopics.splice(candidateIndex, 1);
        }
      }
    }
  }

  // Workload capacity analysis
  const isOverCapacity = totalPendingMinutes > totalAvailableMinutes;
  const capacityDeficitMinutes = Math.max(0, totalPendingMinutes - totalAvailableMinutes);

  const studyPlan = {
    id: planId,
    name: `Study Plan (${startDate} to ${endDate})`,
    startDate,
    endDate,
    status: 'active',
    configuration: {
      selectedSubjectIds: subjects.map(s => s.id),
      totalAvailableMinutes,
      totalAllocatedMinutes,
      totalPendingMinutes,
      isOverCapacity,
      capacityDeficitMinutes,
      triageAdvice: isOverCapacity
        ? `Pending syllabus requires ${(totalPendingMinutes / 60).toFixed(1)}h, but your available capacity is ${(totalAvailableMinutes / 60).toFixed(1)}h. We prioritized urgent upcoming exams and high-difficulty topics. Consider adding weekend availability or reducing optional topics.`
        : 'All pending topics comfortably fit into your available study schedule.'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    studyPlan,
    sessions: newSessions,
    isOverCapacity,
    capacityDeficitMinutes,
    totalAvailableMinutes,
    totalAllocatedMinutes
  };
}

function buildSessionObjective(topic, taskType) {
  if (taskType === 'revision') {
    return `Reinforce core formulas and resolve misunderstandings for "${topic.title}".`;
  }
  if (taskType === 'practice') {
    return `Solve examination-style problems and review edge cases for "${topic.title}".`;
  }
  return `Understand foundational concepts and theory of "${topic.title}".`;
}

function buildSuggestedActivities(topic, taskType) {
  if (taskType === 'revision') {
    return [
      'Quick 10-minute active recall review of summary notes',
      'Redraw key diagrams or derive primary equations from memory',
      'Test yourself on past exam questions'
    ];
  }
  if (taskType === 'practice') {
    return [
      'Solve 3-5 timed practice problems',
      'Review wrong answers and diagnose specific error causes',
      'Make flashcards for tricky corner cases'
    ];
  }
  return [
    'Read chapter section thoroughly without distraction',
    'Summarize key takeaways in your own words',
    'Write down 2 questions to clarify if anything was unclear'
  ];
}

function buildCompletionCriteria(topic, taskType) {
  if (taskType === 'revision') {
    return 'Recall key definitions and equations without glancing at notes.';
  }
  if (taskType === 'practice') {
    return 'Complete at least 3 practice problems with > 80% accuracy.';
  }
  return 'Explain the core concept in simple terms to yourself.';
}
