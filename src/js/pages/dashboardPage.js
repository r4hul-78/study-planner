import { store } from '../state/store.js';
import { calculateProgressMetrics } from '../services/progressService.js';
import { getTodayString, formatDate, formatTime } from '../utils/dateUtils.js';
import { openFocusTimer } from '../components/timerModal.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export function renderDashboard() {
  const state = store.getState();
  const today = getTodayString();
  const metrics = calculateProgressMetrics(state);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = state.profile?.displayName || 'Student Pilot';

  // Quotes pool
  const quotes = [
    'Consistency beats intensity. One focused session at a time.',
    'Small daily improvements over time lead to stunning results.',
    'Focus on the process, not just the examination score.',
    'Mastery is built through deliberate, focused practice.'
  ];
  const dailyQuote = quotes[new Date().getDate() % quotes.length];

  // Today's sessions
  const todaySessions = (state.sessions || [])
    .filter(s => s.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Subject Map
  const subjectMap = new Map(state.subjects.map(s => [s.id, s]));
  const topicMap = new Map(state.topics.map(t => [t.id, t]));

  // Upcoming Exams
  const upcomingExams = metrics.subjectMetrics
    .filter(s => s.examDate && s.daysUntilExam !== null && s.daysUntilExam >= 0)
    .sort((a, b) => a.daysUntilExam - b.daysUntilExam)
    .slice(0, 3);

  return `
    <div class="welcome-banner">
      <div class="welcome-content">
        <h2>${greeting}, ${studentName}</h2>
        <p style="font-size: 0.9375rem; color: var(--text-secondary);">
          Today is <strong>${formatDate(today, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
        <div class="quote-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path></svg>
          <span>${dailyQuote}</span>
        </div>
      </div>
      <div>
        <a href="#/planner" class="btn btn-primary" id="btn-banner-new-plan">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          <span>Generate Study Plan</span>
        </a>
      </div>
    </div>

    <!-- Exam Countdowns -->
    ${upcomingExams.length > 0 ? `
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.75rem;">
          Upcoming Examination Deadlines
        </h3>
        <div class="countdown-grid">
          ${upcomingExams.map(exam => {
            const isUrgent = exam.daysUntilExam <= 3;
            const isApproaching = exam.daysUntilExam <= 7;
            const statusClass = isUrgent ? 'urgent' : isApproaching ? 'approaching' : '';
            return `
              <div class="countdown-card" style="border-left-color: ${exam.color};">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-weight: 600; font-size: 0.9375rem; color: var(--text-primary);">${exam.name}</span>
                  <span class="badge ${isUrgent ? 'badge-rose' : 'badge-emerald'}">
                    ${formatDate(exam.examDate, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                  <div class="countdown-days ${statusClass}">
                    ${exam.daysUntilExam === 0 ? 'TODAY' : exam.daysUntilExam}
                  </div>
                  <span style="font-size: 0.8125rem; color: var(--text-muted);">
                    ${exam.daysUntilExam === 0 ? '' : exam.daysUntilExam === 1 ? 'day remaining' : 'days remaining'}
                  </span>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
                    <span style="color: var(--text-secondary);">Syllabus Coverage</span>
                    <span style="font-weight: 600; color: var(--text-primary);">${exam.completionPercentage}%</span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${exam.completionPercentage}%; background: ${exam.color};"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Stat Summary Metrics -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="stat-card">
        <div class="stat-header">
          <span>Syllabus Coverage</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-400)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="stat-value text-emerald">${metrics.overallCompletionPercentage}%</div>
        <div class="stat-subtext">
          <span>${metrics.completedTopics} of ${metrics.totalTopics} topics completed</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Study Hours Logged</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal-500)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
        </div>
        <div class="stat-value text-teal">${metrics.totalStudyHours}h</div>
        <div class="stat-subtext">
          <span>${Math.round(metrics.totalActualMinutes / 60)}h productive focus</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Exam Readiness</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${metrics.readiness.color}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <div class="stat-value" style="color: ${metrics.readiness.color};">${metrics.readiness.score}%</div>
        <div class="stat-subtext">
          <span>${metrics.readiness.label}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Weak Areas</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber-500)" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path></svg>
        </div>
        <div class="stat-value text-amber">${metrics.weakTopics.length}</div>
        <div class="stat-subtext">
          <span>Low confidence or revision</span>
        </div>
      </div>
    </div>

    <!-- Main Two-Column Content Grid -->
    <div class="dashboard-grid">
      <!-- Left Column: Today's Schedule -->
      <div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Today's Study Plan</span>
            </h3>
            <span class="badge badge-emerald">${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'}</span>
          </div>
          <div class="card-body">
            ${todaySessions.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                </div>
                <div class="empty-state-title">No study sessions scheduled for today</div>
                <div class="empty-state-text">
                  Your day is completely open! Generate a fresh plan or enjoy a well-deserved rest.
                </div>
                <a href="#/planner" class="btn btn-primary btn-sm" style="margin-top: 0.75rem;">
                  Generate Plan for Today
                </a>
              </div>
            ` : `
              <div class="session-list">
                ${todaySessions.map(session => {
                  const subject = subjectMap.get(session.subjectId);
                  const topic = topicMap.get(session.topicId);
                  const isCompleted = session.status === 'completed';
                  const isInProgress = session.status === 'in_progress';

                  return `
                    <div class="session-card status-${session.status}" data-session-id="${session.id}">
                      <div class="session-time">
                        <span class="session-time-start">${formatTime(session.startTime)}</span>
                        <span class="session-time-duration">${session.durationMinutes} mins</span>
                      </div>

                      <div class="session-info">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span class="badge" style="background: ${subject?.color || '#10b981'}20; color: ${subject?.color || '#10b981'}; border: 1px solid ${subject?.color || '#10b981'}40;">
                            ${subject?.name || 'General'}
                          </span>
                          <span class="badge ${session.taskType === 'revision' ? 'badge-amber' : session.taskType === 'practice' ? 'badge-blue' : 'badge-emerald'}">
                            ${session.taskType}
                          </span>
                        </div>
                        <div class="session-title">${topic?.title || 'Study Session'}</div>
                        <div class="session-meta">
                          <span>${session.objective || 'Focus on syllabus goals.'}</span>
                        </div>
                      </div>

                      <div class="session-actions">
                        ${isCompleted ? `
                          <span class="badge badge-emerald">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Completed
                          </span>
                        ` : `
                          <button class="btn ${isInProgress ? 'btn-primary' : 'btn-outline'} btn-sm btn-start-focus" data-id="${session.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                            <span>${isInProgress ? 'Resume' : 'Start Focus'}</span>
                          </button>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Right Column: Smart Recommendations & Subject Progress -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Smart Recommendations -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-400)" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
              <span>Smart Recommendations</span>
            </h3>
          </div>
          <div class="card-body">
            ${metrics.recommendations.map(rec => `
              <div class="rec-card">
                <div class="rec-icon ${rec.type === 'danger' ? 'text-rose' : rec.type === 'warning' ? 'text-amber' : 'text-emerald'}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.125rem;">
                    ${rec.title}
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    ${rec.message}
                  </div>
                  <a href="${rec.actionRoute}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.625rem;">
                    ${rec.actionLabel} &rarr;
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Subject Overview Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Subject Progress</h3>
            <a href="#/subjects" style="font-size: 0.8125rem;">View All &rarr;</a>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 1rem;">
            ${metrics.subjectMetrics.map(sub => `
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.375rem;">
                  <span style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${sub.name}</span>
                  <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);">${sub.completionPercentage}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${sub.completionPercentage}%; background: ${sub.color};"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                  <span>${sub.completedTopics} / ${sub.totalTopics} topics</span>
                  <span>${sub.remainingHours}h remaining</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindDashboardEvents(container) {
  // Focus Timer trigger
  container.querySelectorAll('.btn-start-focus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sessionId = btn.getAttribute('data-id');
      const state = store.getState();
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        openFocusTimer(session);
      }
    });
  });
}
