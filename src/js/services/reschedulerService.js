import { generateId } from '../utils/idGenerator.js';
import {
  getTodayString,
  addDays,
  daysBetween,
  getDayOfWeek,
  timeToMinutes,
  minutesToTime
} from '../utils/dateUtils.js';
import { calculateTopicPriority } from './plannerEngine.js';

/**
 * Generates an adaptive reschedule preview for missed or incomplete tasks.
 * Preserves completed sessions and locked sessions.
 */
export function generateReschedulePreview({
  targetSessionId = null,
  mode = 'all_unfinished', // 'single' | 'all_unfinished' | 'upcoming_week'
  sessions = [],
  subjects = [],
  topics = [],
  preferences = {},
  todayStr = getTodayString()
}) {
  const sessionDuration = preferences.defaultSessionDuration || 45;
  const breakDuration = preferences.defaultBreakDuration || 10;
  const maxDailyMinutes = (preferences.maxDailyHours || 5) * 60;
  const dailyAvailability = preferences.dailyAvailability || {};

  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const topicMap = new Map(topics.map(t => [t.id, t]));

  // 1. Identify completed and locked sessions - these are strictly IMMUTABLE
  const immutableSessions = sessions.filter(s => s.status === 'completed' || s.locked === true);

  // 2. Identify unfinished / missed sessions needing reallocation
  let sessionsToReschedule = [];

  if (mode === 'single' && targetSessionId) {
    sessionsToReschedule = sessions.filter(s => s.id === targetSessionId && s.status !== 'completed' && !s.locked);
  } else {
    // Find all sessions in the past that are not completed, or explicitly marked 'missed' or 'scheduled' for past dates
    sessionsToReschedule = sessions.filter(s => {
      if (s.status === 'completed' || s.locked) return false;
      const isPast = daysBetween(s.date, todayStr) > 0;
      return isPast || s.status === 'missed';
    });
  }

  if (sessionsToReschedule.length === 0) {
    return {
      success: true,
      changesCount: 0,
      message: 'No missed or unfinished sessions found that require rescheduling.',
      updatedSessions: [...sessions],
      movedDetails: []
    };
  }

  // 3. Recalculate priority for unfinished tasks
  const tasksToPlace = sessionsToReschedule.map(session => {
    const topic = topicMap.get(session.topicId);
    const subject = subjectMap.get(session.subjectId);
    const priority = topic ? calculateTopicPriority(topic, subject, todayStr) : session.priority;
    return {
      session,
      topic,
      subject,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);

  // 4. Find open future slots starting from today
  const existingFutureSessions = sessions.filter(s => (
    (s.date >= todayStr) &&
    !sessionsToReschedule.some(m => m.id === s.id)
  ));

  const movedDetails = [];
  const newlyPlacedSessions = [];

  // Track daily load for future dates
  const dailyAllocated = new Map();
  for (const s of existingFutureSessions) {
    const cur = dailyAllocated.get(s.date) || 0;
    dailyAllocated.set(s.date, cur + (s.durationMinutes || sessionDuration));
  }

  // Attempt to slot tasks across the next 14 days
  for (const taskItem of tasksToPlace) {
    const { session, topic, subject, priority } = taskItem;
    let placed = false;

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const candidateDate = addDays(todayStr, dayOffset);
      const dayOfWeek = getDayOfWeek(candidateDate);
      const windows = dailyAvailability[dayOfWeek] || [];

      // Check exam date constraint
      if (subject?.examDate) {
        const daysLeft = daysBetween(candidateDate, subject.examDate);
        if (daysLeft < 0) continue; // Cannot schedule after exam
      }

      const currentDayLoad = dailyAllocated.get(candidateDate) || 0;
      if (currentDayLoad + sessionDuration > maxDailyMinutes) {
        continue; // Exceeds daily max hours
      }

      // Check time window availability
      for (const window of windows) {
        const windowStart = timeToMinutes(window.startTime);
        const windowEnd = timeToMinutes(window.endTime);

        // Find existing sessions on this date in this window
        const sessionsInDate = [
          ...existingFutureSessions.filter(s => s.date === candidateDate),
          ...newlyPlacedSessions.filter(s => s.date === candidateDate)
        ];

        // Find earliest non-overlapping slot
        let testStart = windowStart;
        while (testStart + sessionDuration <= windowEnd) {
          const testEnd = testStart + sessionDuration;
          const hasOverlap = sessionsInDate.some(s => {
            const sStart = timeToMinutes(s.startTime);
            const sEnd = timeToMinutes(s.endTime);
            return (testStart < sEnd && testEnd > sStart);
          });

          if (!hasOverlap) {
            // Found a valid slot!
            const newStartStr = minutesToTime(testStart);
            const newEndStr = minutesToTime(testEnd);

            const updatedSession = {
              ...session,
              date: candidateDate,
              startTime: newStartStr,
              endTime: newEndStr,
              priority,
              status: 'scheduled',
              updatedAt: new Date().toISOString()
            };

            newlyPlacedSessions.push(updatedSession);
            dailyAllocated.set(candidateDate, currentDayLoad + sessionDuration);

            movedDetails.push({
              sessionId: session.id,
              topicTitle: topic?.title || 'Unknown Topic',
              subjectName: subject?.name || 'General',
              oldDate: session.date,
              oldTime: `${session.startTime} - ${session.endTime}`,
              newDate: candidateDate,
              newTime: `${newStartStr} - ${newEndStr}`,
              reason: 'Rescheduled into next available study window'
            });

            placed = true;
            break;
          }

          testStart += 15; // Step in 15m increments
        }

        if (placed) break;
      }

      if (placed) break;
    }

    if (!placed) {
      // Over capacity - keep session but flag date as today with pending notice
      movedDetails.push({
        sessionId: session.id,
        topicTitle: topic?.title || 'Unknown Topic',
        subjectName: subject?.name || 'General',
        oldDate: session.date,
        oldTime: `${session.startTime} - ${session.endTime}`,
        newDate: todayStr,
        newTime: session.startTime,
        reason: 'Capacity warning: No available slot found before exam. Needs manual allocation.'
      });
      newlyPlacedSessions.push({
        ...session,
        date: todayStr,
        status: 'scheduled'
      });
    }
  }

  // Combine into updated session list
  const untouchedSessions = sessions.filter(s => !sessionsToReschedule.some(m => m.id === s.id));
  const finalSessions = [...untouchedSessions, ...newlyPlacedSessions];

  return {
    success: true,
    changesCount: movedDetails.length,
    message: `Rescheduled ${movedDetails.length} task(s) into future available slots without affecting completed records.`,
    updatedSessions: finalSessions,
    movedDetails
  };
}
