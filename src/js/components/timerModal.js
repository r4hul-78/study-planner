import { modal } from './modal.js';
import { toast } from './toast.js';
import { store } from '../state/store.js';

let timerInterval = null;

export function openFocusTimer(session) {
  const state = store.getState();
  const subject = state.subjects.find(s => s.id === session.subjectId);
  const topic = state.topics.find(t => t.id === session.topicId);

  let totalSeconds = (session.durationMinutes || 45) * 60;
  let remainingSeconds = totalSeconds;
  let isRunning = true;
  let startTime = Date.now();
  let elapsedSeconds = 0;

  // Mark session in progress
  store.updateSession(session.id, { status: 'in_progress' });

  function formatDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const contentHtml = `
    <div class="timer-modal-content">
      <div class="badge badge-emerald" style="margin-bottom: 0.5rem;">
        ${subject?.name || 'General Subject'}
      </div>
      <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
        ${topic?.title || 'Study Session'}
      </h2>
      <p style="font-size: 0.875rem; color: var(--text-secondary); max-width: 420px; margin: 0 auto;">
        ${session.objective || 'Focus on your session objectives.'}
      </p>

      <div class="timer-digits" id="timer-display">
        ${formatDisplay(remainingSeconds)}
      </div>

      <div class="progress-bar-container" style="max-width: 360px; margin: 0 auto 1.5rem auto;">
        <div class="progress-bar-fill" id="timer-progress" style="width: 0%;"></div>
      </div>

      <div class="timer-controls">
        <button class="btn btn-secondary" id="btn-timer-toggle">
          <span id="timer-toggle-label">Pause</span>
        </button>
        <button class="btn btn-primary" id="btn-timer-finish">
          Complete &amp; Log Progress
        </button>
      </div>
    </div>
  `;

  modal.open({
    title: 'Focus Study Session',
    content: contentHtml,
    size: 'medium',
    onOpen: (modalEl) => {
      const displayEl = modalEl.querySelector('#timer-display');
      const progressEl = modalEl.querySelector('#timer-progress');
      const toggleBtn = modalEl.querySelector('#btn-timer-toggle');
      const toggleLabel = modalEl.querySelector('#timer-toggle-label');
      const finishBtn = modalEl.querySelector('#btn-timer-finish');

      timerInterval = setInterval(() => {
        if (!isRunning) return;

        if (remainingSeconds > 0) {
          remainingSeconds--;
          elapsedSeconds++;
          displayEl.textContent = formatDisplay(remainingSeconds);
          const percent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
          progressEl.style.width = `${Math.min(100, percent)}%`;
        } else {
          // Timer finished
          clearInterval(timerInterval);
          toast.success('Great job! You completed your planned study time.');
        }
      }, 1000);

      toggleBtn.addEventListener('click', () => {
        isRunning = !isRunning;
        toggleLabel.textContent = isRunning ? 'Pause' : 'Resume';
      });

      finishBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
        openLogProgressModal(session, actualMinutes, subject, topic);
      });
    },
    onClose: () => {
      if (timerInterval) clearInterval(timerInterval);
    }
  });
}

function openLogProgressModal(session, actualMinutes, subject, topic) {
  const contentHtml = `
    <form id="log-progress-form">
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
          Session Complete: ${topic?.title || 'Topic'}
        </h4>
        <p style="font-size: 0.8125rem; color: var(--text-muted);">
          Record actual time spent and evaluate your understanding.
        </p>
      </div>

      <div class="form-group">
        <label class="form-label" for="input-actual-mins">Actual Time Spent (minutes)</label>
        <input class="form-input" id="input-actual-mins" type="number" min="1" max="600" value="${actualMinutes}" required />
      </div>

      <div class="form-group">
        <label class="form-label">How confident do you feel about this topic now?</label>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
          ${[1, 2, 3, 4, 5].map(num => `
            <label style="flex: 1; text-align: center; padding: 0.625rem 0.25rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); cursor: pointer; background: var(--bg-surface-elevated);" class="confidence-label">
              <input type="radio" name="confidence" value="${num}" ${num === 4 ? 'checked' : ''} style="margin-right: 0.25rem;" />
              <div style="font-weight: 700; font-size: 1rem;">${num}</div>
              <div style="font-size: 0.6875rem; color: var(--text-muted);">
                ${num === 1 ? 'Poor' : num === 3 ? 'Fair' : num === 5 ? 'Mastered' : ''}
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="select-completion-status">Topic Status</label>
        <select class="form-select" id="select-completion-status">
          <option value="completed" selected>Completed - Concept is clear</option>
          <option value="partial">Partially Understood - Needs further practice</option>
          <option value="needs_revision">Needs Revision - Struggled with key parts</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="textarea-session-notes">Progress Notes (optional)</label>
        <textarea class="form-textarea" id="textarea-session-notes" placeholder="What went well? Any formulas or problems you struggled with?"></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-primary" id="btn-save-progress">Save &amp; Update Syllabus</button>
  `;

  modal.open({
    title: 'Log Study Progress',
    content: contentHtml,
    footer: footerHtml,
    size: 'medium',
    onOpen: (modalEl) => {
      const saveBtn = modalEl.querySelector('#btn-save-progress');
      saveBtn.addEventListener('click', () => {
        const actualMinsInput = modalEl.querySelector('#input-actual-mins').value;
        const confidenceInput = modalEl.querySelector('input[name="confidence"]:checked')?.value || 3;
        const statusSelect = modalEl.querySelector('#select-completion-status').value;
        const notesInput = modalEl.querySelector('#textarea-session-notes').value;

        store.recordSessionCompletion(session.id, {
          actualMinutes: Number(actualMinsInput),
          confidence: Number(confidenceInput),
          notes: notesInput,
          completionStatus: statusSelect
        });

        modal.close();
        toast.success(`Progress saved for ${topic?.title || 'topic'}! Syllabus updated.`);
      });
    }
  });
}
