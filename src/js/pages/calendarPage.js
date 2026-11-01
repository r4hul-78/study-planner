import { store } from '../state/store.js';
import { modal } from '../components/modal.js';
import { openFocusTimer } from '../components/timerModal.js';
import {
  getTodayString,
  getMonthMatrix,
  formatDate,
  formatTime
} from '../utils/dateUtils.js';

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth();
let activeCalendarView = 'month'; // 'month' | 'agenda'
let selectedSubjectFilter = 'all';

export function renderCalendar() {
  const state = store.getState();
  const today = getTodayString();
  const subjects = state.subjects || [];
  const topics = state.topics || [];
  const sessions = state.sessions || [];

  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const topicMap = new Map(topics.map(t => [t.id, t]));

  // Apply filters
  let filteredSessions = sessions;
  if (selectedSubjectFilter !== 'all') {
    filteredSessions = filteredSessions.filter(s => s.subjectId === selectedSubjectFilter);
  }

  // Month Matrix
  const matrix = getMonthMatrix(currentCalYear, currentCalMonth);
  const monthTitle = new Date(currentCalYear, currentCalMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Group filtered sessions by date string
  const sessionsByDate = new Map();
  for (const s of filteredSessions) {
    if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, []);
    sessionsByDate.get(s.date).push(s);
  }

  return `
    <div>
      <div class="view-toolbar">
        <div>
          <h2>Academic Calendar</h2>
          <p>Visual roadmap of study blocks, practice sessions, and exams.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <select class="form-select" id="cal-subject-filter" style="width: auto; font-size: 0.8125rem;">
            <option value="all">All Subjects</option>
            ${subjects.map(s => `<option value="${s.id}" ${selectedSubjectFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>

          <div class="tab-group">
            <button class="tab-btn ${activeCalendarView === 'month' ? 'active' : ''}" id="tab-view-month">Month Grid</button>
            <button class="tab-btn ${activeCalendarView === 'agenda' ? 'active' : ''}" id="tab-view-agenda">Agenda List</button>
          </div>
        </div>
      </div>

      <!-- Month Navigation Toolbar -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; background: var(--bg-surface); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <h3 style="font-size: 1.125rem; font-weight: 700;">${monthTitle}</h3>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" id="cal-prev-month">&larr; Prev</button>
          <button class="btn btn-secondary btn-sm" id="cal-today-btn">Today</button>
          <button class="btn btn-secondary btn-sm" id="cal-next-month">Next &rarr;</button>
        </div>
      </div>

      <!-- Month Grid View -->
      <div id="cal-month-container" style="${activeCalendarView === 'month' ? '' : 'display: none;'}">
        <div class="calendar-grid">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
            <div class="calendar-header-cell">${day}</div>
          `).join('')}

          ${matrix.flat().map(cell => {
            const dateSessions = sessionsByDate.get(cell.dateString) || [];
            const isToday = cell.dateString === today;
            const otherMonth = !cell.isCurrentMonth ? 'other-month' : '';

            return `
              <div class="calendar-day-cell ${otherMonth} ${isToday ? 'today' : ''}" data-date="${cell.dateString}">
                <div class="day-number">${cell.dayNumber}</div>
                <div style="display: flex; flex-direction: column; gap: 0.25rem; overflow: hidden;">
                  ${dateSessions.slice(0, 3).map(s => {
                    const sub = subjectMap.get(s.subjectId);
                    const top = topicMap.get(s.topicId);
                    return `
                      <div class="calendar-pill btn-open-session-detail" data-id="${s.id}" style="border-left-color: ${sub?.color || '#10b981'};">
                        ${formatTime(s.startTime)} ${top?.title || 'Study'}
                      </div>
                    `;
                  }).join('')}
                  ${dateSessions.length > 3 ? `
                    <div style="font-size: 0.625rem; color: var(--text-muted); font-weight: 600;">
                      +${dateSessions.length - 3} more
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Agenda View -->
      <div id="cal-agenda-container" style="${activeCalendarView === 'agenda' ? '' : 'display: none;'}">
        <div class="card" style="padding: 1.25rem;">
          ${filteredSessions.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-title">No sessions scheduled</div>
              <div class="empty-state-text">No study sessions match your selected subject filter.</div>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${[...filteredSessions]
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map(s => {
                  const sub = subjectMap.get(s.subjectId);
                  const top = topicMap.get(s.topicId);
                  return `
                    <div class="session-card status-${s.status} btn-open-session-detail" data-id="${s.id}" style="cursor: pointer; margin-bottom: 0;">
                      <div class="session-time">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(s.date)}</span>
                        <span class="session-time-start">${formatTime(s.startTime)}</span>
                      </div>
                      <div class="session-info">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span class="badge" style="background: ${sub?.color || '#10b981'}20; color: ${sub?.color || '#10b981'}; border: 1px solid ${sub?.color || '#10b981'}40;">
                            ${sub?.name}
                          </span>
                          <span class="badge badge-neutral">${s.taskType}</span>
                        </div>
                        <div class="session-title">${top?.title || 'Session'}</div>
                      </div>
                      <div class="session-actions">
                        <span class="badge ${s.status === 'completed' ? 'badge-emerald' : 'badge-neutral'}">
                          ${s.status}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

export function bindCalendarEvents(container) {
  // Month Switcher
  container.querySelector('#cal-prev-month')?.addEventListener('click', () => {
    if (currentCalMonth === 0) {
      currentCalMonth = 11;
      currentCalYear--;
    } else {
      currentCalMonth--;
    }
    reRender();
  });

  container.querySelector('#cal-next-month')?.addEventListener('click', () => {
    if (currentCalMonth === 11) {
      currentCalMonth = 0;
      currentCalYear++;
    } else {
      currentCalMonth++;
    }
    reRender();
  });

  container.querySelector('#cal-today-btn')?.addEventListener('click', () => {
    currentCalYear = new Date().getFullYear();
    currentCalMonth = new Date().getMonth();
    reRender();
  });

  // Tab switcher
  container.querySelector('#tab-view-month')?.addEventListener('click', () => {
    activeCalendarView = 'month';
    reRender();
  });

  container.querySelector('#tab-view-agenda')?.addEventListener('click', () => {
    activeCalendarView = 'agenda';
    reRender();
  });

  // Subject filter
  container.querySelector('#cal-subject-filter')?.addEventListener('change', (e) => {
    selectedSubjectFilter = e.target.value;
    reRender();
  });

  // Session detail clicks
  container.querySelectorAll('.btn-open-session-detail').forEach(el => {
    el.addEventListener('click', () => {
      const sessionId = el.getAttribute('data-id');
      const session = store.getState().sessions.find(s => s.id === sessionId);
      if (session) openSessionDetailModal(session);
    });
  });

  function reRender() {
    const appView = document.getElementById('app-view');
    if (appView) {
      appView.innerHTML = renderCalendar();
      bindCalendarEvents(appView);
    }
  }
}

function openSessionDetailModal(session) {
  const state = store.getState();
  const subject = state.subjects.find(s => s.id === session.subjectId);
  const topic = state.topics.find(t => t.id === session.topicId);

  const contentHtml = `
    <div>
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <span class="badge" style="background: ${subject?.color || '#10b981'}20; color: ${subject?.color || '#10b981'}; border: 1px solid ${subject?.color || '#10b981'}40;">
          ${subject?.name || 'General'}
        </span>
        <span class="badge badge-emerald">${session.taskType}</span>
        <span class="badge badge-neutral">Priority: ${session.priority}</span>
        ${session.locked ? '<span class="badge badge-purple">Locked</span>' : ''}
      </div>

      <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
        ${topic?.title || 'Study Session'}
      </h3>

      <div style="display: flex; gap: 1rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.25rem;">
        <span>📅 ${formatDate(session.date)}</span>
        <span>⏰ ${formatTime(session.startTime)} - ${formatTime(session.endTime)} (${session.durationMinutes} mins)</span>
      </div>

      <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
        <div style="font-weight: 600; font-size: 0.8125rem; color: var(--emerald-400); margin-bottom: 0.25rem;">
          🎯 Session Objective
        </div>
        <p style="font-size: 0.875rem; color: var(--text-primary);">
          ${session.objective || 'Complete syllabus reading and exercises.'}
        </p>
      </div>

      ${session.suggestedActivities && session.suggestedActivities.length > 0 ? `
        <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
          <div style="font-weight: 600; font-size: 0.8125rem; color: var(--teal-500); margin-bottom: 0.375rem;">
            📝 Suggested Activities
          </div>
          <ul style="padding-left: 1.25rem; font-size: 0.8125rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem;">
            ${session.suggestedActivities.map(act => `<li>${act}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="card" style="padding: 1rem;">
        <div style="font-weight: 600; font-size: 0.8125rem; color: var(--blue-500); margin-bottom: 0.25rem;">
          ✅ Completion Criteria
        </div>
        <p style="font-size: 0.8125rem; color: var(--text-secondary);">
          ${session.completionCriteria || 'Master key concepts.'}
        </p>
      </div>
    </div>
  `;

  modal.open({
    title: 'Study Session Details',
    content: contentHtml,
    footer: `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Close</button>
      ${session.status !== 'completed' ? `
        <button class="btn btn-primary" id="btn-detail-start-focus">Start Focus Session</button>
      ` : ''}
    `,
    size: 'medium',
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-detail-start-focus')?.addEventListener('click', () => {
        modal.close();
        openFocusTimer(session);
      });
    }
  });
}
