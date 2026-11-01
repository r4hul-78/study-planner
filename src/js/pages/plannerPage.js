import { store } from '../state/store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { apiClient } from '../services/apiClient.js';
import { generateDeterministicPlan } from '../services/plannerEngine.js';
import { generateReschedulePreview } from '../services/reschedulerService.js';
import { openFocusTimer } from '../components/timerModal.js';
import { getTodayString, formatDate, formatTime, addDays, daysBetween } from '../utils/dateUtils.js';

export function renderPlanner() {
  const state = store.getState();
  const today = getTodayString();
  const sessions = state.sessions || [];
  const subjects = state.subjects || [];
  const activePlan = state.studyPlans?.[0] || null;

  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const topicMap = new Map((state.topics || []).map(t => [t.id, t]));

  // Check for missed / overdue sessions
  const missedSessions = sessions.filter(s => s.status !== 'completed' && daysBetween(s.date, today) > 0);

  // Group upcoming sessions by date
  const groupedSessions = new Map();
  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  for (const s of sortedSessions) {
    if (!groupedSessions.has(s.date)) groupedSessions.set(s.date, []);
    groupedSessions.get(s.date).push(s);
  }

  return `
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h2>Intelligent Study Planner</h2>
          <p>Actionable, conflict-free study schedule tailored to your availability.</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" id="btn-trigger-reschedule">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            <span>Adaptive Reschedule</span>
          </button>
          <button class="btn btn-primary btn-sm" id="btn-open-plan-wizard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            <span>Generate New Plan</span>
          </button>
        </div>
      </div>

      <!-- Overdue / Missed Alert Banner -->
      ${missedSessions.length > 0 ? `
        <div class="card" style="border-left: 4px solid var(--rose-500); padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: var(--bg-surface-elevated);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="color: var(--rose-500);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.9375rem; color: var(--text-primary);">
                ${missedSessions.length} Missed or Incomplete Study Task(s) Detected
              </div>
              <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                Adaptive rescheduling re-allocates unfinished work into your upcoming open availability slots.
              </div>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" id="btn-banner-reschedule">
            Reschedule Missed Work
          </button>
        </div>
      ` : ''}

      <!-- Capacity & Active Plan Info -->
      ${activePlan ? `
        <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div>
              <span class="badge badge-emerald" style="margin-bottom: 0.25rem;">Active Schedule</span>
              <h3 style="font-size: 1.125rem; font-weight: 700;">${activePlan.name}</h3>
            </div>
            <div style="display: flex; gap: 1rem; font-size: 0.8125rem; color: var(--text-secondary);">
              <div>Allocated: <strong>${(activePlan.configuration?.totalAllocatedMinutes / 60 || 0).toFixed(1)}h</strong></div>
              <div>Available Capacity: <strong>${(activePlan.configuration?.totalAvailableMinutes / 60 || 0).toFixed(1)}h</strong></div>
            </div>
          </div>

          ${activePlan.configuration?.isOverCapacity ? `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--amber-500); display: flex; align-items: flex-start; gap: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path></svg>
              <div>
                <strong>Workload Capacity Alert:</strong> ${activePlan.configuration.triageAdvice}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Daily Schedule Timeline -->
      ${groupedSessions.size === 0 ? `
        <div class="card empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="empty-state-title">No study sessions currently planned</div>
          <div class="empty-state-text">Click "Generate New Plan" to automatically build your personalized timetable.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-generate-plan" style="margin-top: 0.75rem;">Generate Plan</button>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${Array.from(groupedSessions.entries()).map(([dateStr, daySessions]) => {
            const isToday = dateStr === today;
            const isPast = daysBetween(dateStr, today) > 0;
            const dayLabel = isToday ? 'Today' : dateStr === addDays(today, 1) ? 'Tomorrow' : formatDate(dateStr, { weekday: 'long' });

            return `
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.375rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 700; font-size: 1.0625rem; color: ${isToday ? 'var(--emerald-400)' : 'var(--text-primary)'};">
                      ${dayLabel}
                    </span>
                    <span style="font-size: 0.8125rem; color: var(--text-muted);">
                      ${formatDate(dateStr, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    ${isToday ? '<span class="badge badge-emerald">Today</span>' : ''}
                    ${isPast ? '<span class="badge badge-rose">Past Date</span>' : ''}
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">
                    ${daySessions.length} session${daySessions.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${daySessions.map(session => {
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
                            <span class="badge badge-neutral">Priority: ${session.priority}</span>
                            ${session.locked ? '<span class="badge badge-purple">Locked</span>' : ''}
                          </div>
                          
                          <div class="session-title">${topic?.title || 'Study Task'}</div>
                          <div class="session-meta">
                            <span>🎯 ${session.objective || 'Focus on learning objective.'}</span>
                          </div>
                        </div>

                        <div class="session-actions">
                          <button class="btn btn-icon btn-toggle-lock" data-id="${session.id}" title="${session.locked ? 'Unlock Session' : 'Lock Session (protect from rescheduling)'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${session.locked ? 'var(--purple-500)' : 'currentColor'}" stroke-width="2">
                              ${session.locked 
                                ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
                                : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>'}
                            </svg>
                          </button>

                          ${isCompleted ? `
                            <span class="badge badge-emerald">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              Done
                            </span>
                          ` : `
                            <button class="btn ${isInProgress ? 'btn-primary' : 'btn-outline'} btn-sm btn-start-focus" data-id="${session.id}">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                              <span>${isInProgress ? 'Resume' : 'Start'}</span>
                            </button>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

export function bindPlannerEvents(container) {
  // Plan generation modal trigger
  container.querySelectorAll('#btn-open-plan-wizard, #btn-empty-generate-plan').forEach(btn => {
    btn.addEventListener('click', () => openPlanGenerationModal());
  });

  // Adaptive Rescheduling trigger
  container.querySelectorAll('#btn-trigger-reschedule, #btn-banner-reschedule').forEach(btn => {
    btn.addEventListener('click', () => triggerAdaptiveReschedule());
  });

  // Focus Timer buttons
  container.querySelectorAll('.btn-start-focus').forEach(btn => {
    btn.addEventListener('click', () => {
      const sessionId = btn.getAttribute('data-id');
      const session = store.getState().sessions.find(s => s.id === sessionId);
      if (session) openFocusTimer(session);
    });
  });

  // Lock / Unlock toggle buttons
  container.querySelectorAll('.btn-toggle-lock').forEach(btn => {
    btn.addEventListener('click', () => {
      const sessionId = btn.getAttribute('data-id');
      const session = store.getState().sessions.find(s => s.id === sessionId);
      if (session) {
        const nextState = !session.locked;
        store.updateSession(sessionId, { locked: nextState });
        toast.info(nextState ? 'Session locked. It will not be displaced during rescheduling.' : 'Session unlocked.');
      }
    });
  });
}

function openPlanGenerationModal() {
  const state = store.getState();
  const subjects = state.subjects || [];

  const contentHtml = `
    <form id="plan-generation-form">
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
          Generate Study Plan
        </h4>
        <p style="font-size: 0.8125rem; color: var(--text-secondary);">
          Our deterministic engine reconciles your syllabus topics with your weekly availability, break times, and exam priorities.
        </p>
      </div>

      <div class="form-group">
        <label class="form-label" for="plan-horizon">Planning Horizon</label>
        <select class="form-select" id="plan-horizon">
          <option value="1">Today Only (1 Day)</option>
          <option value="7" selected>Next 7 Days (1 Week Sprint)</option>
          <option value="14">Next 14 Days (2 Weeks)</option>
          <option value="30">Next 30 Days (Monthly Horizon)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="plan-exam-focus">Priority Examination Focus (optional)</label>
        <select class="form-select" id="plan-exam-focus">
          <option value="">Balanced - All Active Subjects</option>
          ${subjects.map(s => `<option value="${s.id}">${s.name} ${s.examDate ? `(Exam: ${s.examDate})` : ''}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="checkbox" id="plan-use-ai-strategy" checked style="width: 16px; height: 16px; accent-color: var(--emerald-500);" />
          <span>Enable Gemini Pedagogical Strategy Recommendations</span>
        </label>
        <div class="form-hint" style="margin-left: 1.5rem;">
          Gemini will suggest pedagogical study activities and session breakdowns while our deterministic scheduler enforces strict time windows and capacity boundaries.
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Cancel</button>
    <button class="btn btn-primary" id="btn-submit-generate-plan">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
      <span>Generate &amp; Preview Plan</span>
    </button>
  `;

  modal.open({
    title: 'Study Plan Wizard',
    content: contentHtml,
    footer: footerHtml,
    size: 'medium',
    onOpen: (modalEl) => {
      const submitBtn = modalEl.querySelector('#btn-submit-generate-plan');
      submitBtn.addEventListener('click', async () => {
        const horizonDays = Number(modalEl.querySelector('#plan-horizon').value);
        const useAi = modalEl.querySelector('#plan-use-ai-strategy').checked;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="width:14px;height:14px;"></span> Optimizing schedule...`;

        try {
          // 1. Generate Deterministic Plan
          const planResult = generateDeterministicPlan({
            subjects: state.subjects,
            topics: state.topics,
            preferences: state.profile.preferences,
            horizonDays,
            startDate: getTodayString(),
            existingSessions: state.sessions
          });

          // 2. If AI enabled, fetch strategy advice
          if (useAi) {
            try {
              const pending = state.topics.filter(t => t.status !== 'completed');
              const advice = await apiClient.generatePlanStrategy(state.subjects, pending, horizonDays);
              if (advice?.strategySummary) {
                planResult.studyPlan.configuration.strategySummary = advice.strategySummary;
              }
            } catch (err) {
              console.warn('[Planner] Gemini advice skipped:', err.message);
            }
          }

          // 3. Open Plan Preview Modal for confirmation
          openPlanPreviewModal(planResult);
        } catch (err) {
          toast.error(`Plan generation error: ${err.message}`);
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  });
}

function openPlanPreviewModal(planResult) {
  const { studyPlan, sessions, isOverCapacity, capacityDeficitMinutes, totalAvailableMinutes, totalAllocatedMinutes } = planResult;

  const contentHtml = `
    <div>
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
          Plan Preview: ${studyPlan.name}
        </h4>
        <p style="font-size: 0.8125rem; color: var(--text-secondary);">
          Review the generated session distribution and workload capacity before applying to your schedule.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
        <div class="card" style="padding: 0.75rem; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Allocated Time</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--emerald-400);">
            ${(totalAllocatedMinutes / 60).toFixed(1)}h
          </div>
        </div>
        <div class="card" style="padding: 0.75rem; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Available Capacity</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--teal-500);">
            ${(totalAvailableMinutes / 60).toFixed(1)}h
          </div>
        </div>
        <div class="card" style="padding: 0.75rem; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Total Sessions</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">
            ${sessions.length}
          </div>
        </div>
      </div>

      ${isOverCapacity ? `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--amber-500); margin-bottom: 1rem;">
          <strong>Workload Capacity Alert:</strong> Pending syllabus requires ${(capacityDeficitMinutes / 60).toFixed(1)} more hours than your configured study windows allow. High-priority topics were scheduled first.
        </div>
      ` : ''}

      ${studyPlan.configuration.strategySummary ? `
        <div style="background: var(--emerald-subtle); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.8125rem; color: var(--emerald-400); margin-bottom: 1rem;">
          <strong>AI Strategy Insight:</strong> ${studyPlan.configuration.strategySummary}
        </div>
      ` : ''}

      <div style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;">
        ${sessions.map(s => {
          const subject = store.getState().subjects.find(sub => sub.id === s.subjectId);
          const topic = store.getState().topics.find(top => top.id === s.topicId);
          return `
            <div style="padding: 0.5rem 0.75rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface-elevated); display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
              <div>
                <span style="font-weight: 600; color: ${subject?.color || '#10b981'};">${subject?.name}:</span>
                <span style="color: var(--text-primary); margin-left: 0.25rem;">${topic?.title}</span>
              </div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">
                ${s.date} • ${formatTime(s.startTime)} (${s.durationMinutes}m)
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  modal.open({
    title: 'Confirm Generated Plan',
    content: contentHtml,
    footer: `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-confirm-save-plan">Confirm &amp; Apply Plan</button>
    `,
    size: 'large',
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-confirm-save-plan').addEventListener('click', () => {
        store.commitNewPlan(studyPlan, sessions, true);
        modal.close();
        toast.success(`New study plan applied with ${sessions.length} sessions!`);
      });
    }
  });
}

function triggerAdaptiveReschedule() {
  const state = store.getState();
  const preview = generateReschedulePreview({
    sessions: state.sessions,
    subjects: state.subjects,
    topics: state.topics,
    preferences: state.profile.preferences,
    todayStr: getTodayString()
  });

  if (preview.changesCount === 0) {
    toast.info('All sessions are on track. No missed or incomplete tasks found to reschedule.');
    return;
  }

  const contentHtml = `
    <div>
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
          Adaptive Rescheduling Preview
        </h4>
        <p style="font-size: 0.8125rem; color: var(--text-secondary);">
          ${preview.message}
        </p>
      </div>

      <div style="max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem;">
        ${preview.movedDetails.map(item => `
          <div class="card" style="padding: 0.875rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.375rem;">
              <span style="font-weight: 700; font-size: 0.875rem; color: var(--text-primary);">${item.topicTitle}</span>
              <span class="badge badge-emerald">${item.subjectName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.25rem;">
              <span style="text-decoration: line-through; color: var(--rose-500);">${item.oldDate} (${item.oldTime})</span>
              <span>&rarr;</span>
              <span style="font-weight: 600; color: var(--emerald-400);">${item.newDate} (${item.newTime})</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic;">
              ${item.reason}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.open({
    title: 'Review Rescheduled Sessions',
    content: contentHtml,
    footer: `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-apply-reschedule">Confirm &amp; Update Schedule</button>
    `,
    size: 'medium',
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-apply-reschedule').addEventListener('click', () => {
        store.applyRescheduledSessions(preview.updatedSessions);
        modal.close();
        toast.success(`Rescheduled ${preview.changesCount} session(s) successfully.`);
      });
    }
  });
}
