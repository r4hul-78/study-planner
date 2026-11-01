import { daysBetween, getTodayString } from '../utils/dateUtils.js';

/**
 * Calculates overall syllabus, subject-wise, and exam readiness analytics.
 */
export function calculateProgressMetrics({ subjects = [], topics = [], sessions = [], progress = [] }) {
  const today = getTodayString();
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.status === 'completed').length;
  const inProgressTopics = topics.filter(t => t.status === 'in_progress').length;
  const revisionTopics = topics.filter(t => t.status === 'needs_revision').length;

  const overallCompletionPercentage = totalTopics > 0
    ? Math.round((completedTopics / totalTopics) * 100)
    : 0;

  // Actual vs Planned Study Time
  const totalPlannedMinutes = progress.reduce((acc, p) => acc + (p.plannedMinutes || 0), 0);
  const totalActualMinutes = progress.reduce((acc, p) => acc + (p.actualMinutes || 0), 0);

  // Subject-wise breakdown
  const subjectMetrics = subjects.map(subject => {
    const subjectTopics = topics.filter(t => t.subjectId === subject.id);
    const subTotal = subjectTopics.length;
    const subCompleted = subjectTopics.filter(t => t.status === 'completed').length;
    const subPercentage = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;
    const remainingMinutes = subjectTopics
      .filter(t => t.status !== 'completed')
      .reduce((acc, t) => acc + (t.estimatedMinutes || 45), 0);

    const daysUntilExam = subject.examDate ? daysBetween(today, subject.examDate) : null;

    return {
      id: subject.id,
      name: subject.name,
      color: subject.color || '#10b981',
      totalTopics: subTotal,
      completedTopics: subCompleted,
      completionPercentage: subPercentage,
      remainingMinutes,
      remainingHours: (remainingMinutes / 60).toFixed(1),
      daysUntilExam,
      examDate: subject.examDate
    };
  });

  // Weak Topics Identification (Confidence <= 2 or Status === needs_revision)
  const weakTopics = topics
    .filter(t => (t.confidence <= 2 || t.status === 'needs_revision') && t.status !== 'completed')
    .map(t => {
      const parentSubject = subjects.find(s => s.id === t.subjectId);
      return {
        ...t,
        subjectName: parentSubject?.name || 'General',
        subjectColor: parentSubject?.color || '#10b981',
        examDate: parentSubject?.examDate
      };
    })
    .sort((a, b) => a.confidence - b.confidence);

  // Exam Readiness Calculation
  const readiness = calculateExamReadiness({
    subjects,
    topics,
    sessions,
    progress
  });

  // Smart Contextual Recommendations
  const recommendations = generateSmartRecommendations({
    subjects,
    topics,
    sessions,
    weakTopics,
    today
  });

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    revisionTopics,
    overallCompletionPercentage,
    totalPlannedMinutes,
    totalActualMinutes,
    totalStudyHours: (totalActualMinutes / 60).toFixed(1),
    subjectMetrics,
    weakTopics,
    readiness,
    recommendations
  };
}

/**
 * Computes transparent exam readiness indicator with breakdown.
 */
export function calculateExamReadiness({ subjects, topics, progress }) {
  if (topics.length < 2) {
    return {
      status: 'insufficient_data',
      score: 0,
      label: 'Insufficient Data',
      description: 'Add more topics and complete study sessions to evaluate exam readiness.'
    };
  }

  const completedCount = topics.filter(t => t.status === 'completed').length;
  const coverageRatio = completedCount / topics.length;

  const validConfidenceTopics = topics.filter(t => t.confidence);
  const avgConfidence = validConfidenceTopics.length > 0
    ? validConfidenceTopics.reduce((acc, t) => acc + t.confidence, 0) / validConfidenceTopics.length
    : 3;
  const confidenceRatio = avgConfidence / 5;

  const revisionTopics = topics.filter(t => t.status === 'needs_revision').length;
  const revisionPenalty = Math.min(0.25, (revisionTopics / topics.length) * 0.5);

  // Weighted formula: 55% coverage + 45% confidence - revision penalty
  let score = Math.round(((coverageRatio * 55) + (confidenceRatio * 45) - (revisionPenalty * 100)));
  score = Math.max(0, Math.min(100, score));

  let label = 'Needs Focus';
  let color = '#f43f5e'; // rose

  if (score >= 80) {
    label = 'Exam Ready';
    color = '#10b981'; // emerald
  } else if (score >= 60) {
    label = 'On Track';
    color = '#14b8a6'; // teal
  } else if (score >= 40) {
    label = 'Moderate Progress';
    color = '#f59e0b'; // amber
  }

  return {
    status: 'calculated',
    score,
    label,
    color,
    factors: {
      coverageRatio: Math.round(coverageRatio * 100),
      avgConfidence: avgConfidence.toFixed(1),
      revisionBacklogCount: revisionTopics
    },
    description: `Based on ${Math.round(coverageRatio * 100)}% syllabus coverage, an average confidence rating of ${avgConfidence.toFixed(1)}/5, and ${revisionTopics} topics flagged for revision.`
  };
}

/**
 * Generates dynamic, data-driven study recommendations.
 */
function generateSmartRecommendations({ subjects, topics, sessions, weakTopics, today }) {
  const recs = [];

  // Check for upcoming exam within 7 days
  const upcomingExam = subjects
    .filter(s => s.examDate && daysBetween(today, s.examDate) >= 0 && daysBetween(today, s.examDate) <= 7)
    .sort((a, b) => daysBetween(today, a.examDate) - daysBetween(today, b.examDate))[0];

  if (upcomingExam) {
    const daysLeft = daysBetween(today, upcomingExam.examDate);
    recs.push({
      id: 'rec_exam_urgency',
      type: 'warning',
      title: `Upcoming Exam: ${upcomingExam.name}`,
      message: `${daysLeft === 0 ? 'Exam is TODAY!' : `Exam in ${daysLeft} day(s)`}. Shift focus to practice exams and formula recall.`,
      actionLabel: 'View Exam Plan',
      actionRoute: '#/planner'
    });
  }

  // Check for weak topics
  if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    recs.push({
      id: 'rec_weak_topic',
      type: 'danger',
      title: `Master Weak Area: ${topWeak.title}`,
      message: `You rated your confidence as ${topWeak.confidence || 1}/5. Use the AI Assistant to break down difficult concepts.`,
      actionLabel: 'Ask AI Assistant',
      actionRoute: '#/assistant',
      context: { topicId: topWeak.id, topicTitle: topWeak.title, subjectId: topWeak.subjectId }
    });
  }

  // Check for missed sessions in past
  const missedCount = sessions.filter(s => s.status === 'scheduled' && daysBetween(s.date, today) > 0).length;
  if (missedCount > 0) {
    recs.push({
      id: 'rec_reschedule',
      type: 'info',
      title: `${missedCount} Missed Session(s) Detected`,
      message: 'Unfinished study sessions from past days are pending. Run adaptive rescheduling to rebalance your timetable.',
      actionLabel: 'Reschedule Now',
      actionRoute: '#/planner'
    });
  }

  // Encouragement fallback if everything is on track
  if (recs.length === 0) {
    recs.push({
      id: 'rec_on_track',
      type: 'success',
      title: 'Great Momentum!',
      message: 'You have no overdue sessions and are progressing through your syllabus consistently. Keep it up!',
      actionLabel: 'Generate New Plan',
      actionRoute: '#/planner'
    });
  }

  return recs;
}
