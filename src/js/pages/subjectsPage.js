import { store } from '../state/store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { apiClient } from '../services/apiClient.js';
import { parseSyllabusRules } from '../services/ruleBasedParser.js';
import { formatDate, daysBetween, getTodayString } from '../utils/dateUtils.js';

export function renderSubjects() {
  const state = store.getState();
  const subjects = state.subjects || [];
  const topics = state.topics || [];
  const today = getTodayString();

  return `
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h2>My Subjects &amp; Syllabi</h2>
          <p>Organize your courses, breakdown topics, and import syllabi directly.</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" id="btn-import-syllabus-global">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Import Syllabus</span>
          </button>
          <button class="btn btn-primary btn-sm" id="btn-add-subject">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      ${subjects.length === 0 ? `
        <div class="card empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <div class="empty-state-title">No subjects found</div>
          <div class="empty-state-text">Add your first academic subject or course to start building your study plan.</div>
          <button class="btn btn-primary btn-sm" id="btn-empty-add-subject" style="margin-top: 0.75rem;">Add Subject</button>
        </div>
      ` : `
        <div class="subject-grid">
          ${subjects.map(subject => {
            const subjectTopics = topics.filter(t => t.subjectId === subject.id);
            const total = subjectTopics.length;
            const completed = subjectTopics.filter(t => t.status === 'completed').length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const remainingMins = subjectTopics.filter(t => t.status !== 'completed').reduce((acc, t) => acc + (t.estimatedMinutes || 45), 0);
            const daysLeft = subject.examDate ? daysBetween(today, subject.examDate) : null;

            // Group topics by unit
            const unitsMap = new Map();
            for (const t of subjectTopics) {
              const uTitle = t.unitTitle || 'General Topics';
              if (!unitsMap.has(uTitle)) unitsMap.set(uTitle, []);
              unitsMap.get(uTitle).push(t);
            }

            return `
              <div class="subject-card" data-subject-id="${subject.id}">
                <div class="subject-card-bar" style="background: ${subject.color || '#10b981'};"></div>
                
                <div>
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.375rem;">
                    <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">${subject.name}</h3>
                    <div style="display: flex; gap: 0.25rem;">
                      <button class="btn btn-icon btn-edit-subject" data-id="${subject.id}" title="Edit Subject">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button class="btn btn-icon btn-delete-subject" data-id="${subject.id}" title="Delete Subject">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose-500)" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>

                  <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                    ${subject.description || 'No description provided.'}
                  </p>

                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                    ${subject.examDate ? `
                      <span class="badge ${daysLeft <= 7 ? 'badge-rose' : 'badge-emerald'}">
                        Exam: ${formatDate(subject.examDate)} (${daysLeft <= 0 ? 'Today' : `${daysLeft}d left`})
                      </span>
                    ` : '<span class="badge badge-neutral">No Exam Date</span>'}
                    <span class="badge badge-neutral">Importance: ${subject.importance}/5</span>
                  </div>

                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
                      <span style="color: var(--text-secondary);">${completed}/${total} topics done</span>
                      <span style="font-weight: 600; color: var(--text-primary);">${pct}%</span>
                    </div>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" style="width: ${pct}%; background: ${subject.color || '#10b981'};"></div>
                    </div>
                  </div>
                </div>

                <!-- Unit & Topic Collapsible Breakdown -->
                <div style="margin-top: 0.5rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);">Course Syllabus Units</span>
                    <button class="btn btn-secondary btn-sm btn-add-topic" data-id="${subject.id}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                      + Topic
                    </button>
                  </div>

                  ${unitsMap.size === 0 ? `
                    <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No topics yet. Click "+ Topic" or "Import Syllabus" above.</p>
                  ` : Array.from(unitsMap.entries()).map(([unitTitle, uTopics]) => `
                    <div class="unit-accordion">
                      <div class="unit-header" onclick="this.nextElementSibling.classList.toggle('visually-hidden')">
                        <span style="font-weight: 600; font-size: 0.8125rem;">${unitTitle} (${uTopics.length})</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                      <div>
                        ${uTopics.map(t => `
                          <div class="topic-item">
                            <div style="display: flex; flex-direction: column;">
                              <span style="font-weight: 500; font-size: 0.8125rem; color: var(--text-primary);">${t.title}</span>
                              <span style="font-size: 0.6875rem; color: var(--text-muted);">
                                ${t.estimatedMinutes}m • Diff: ${t.difficulty} • Conf: ${t.confidence}/5
                              </span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.375rem;">
                              <select class="form-select select-topic-status" data-id="${t.id}" style="font-size: 0.6875rem; padding: 0.2rem 0.4rem; width: auto;">
                                <option value="not_started" ${t.status === 'not_started' ? 'selected' : ''}>Not Started</option>
                                <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="needs_revision" ${t.status === 'needs_revision' ? 'selected' : ''}>Needs Revision</option>
                              </select>
                              <button class="btn btn-icon btn-delete-topic" data-id="${t.id}" title="Remove Topic" style="padding: 0.25rem;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem; border-top: 1px solid var(--border-subtle);">
                  <button class="btn btn-secondary btn-sm btn-import-syllabus" data-id="${subject.id}" style="flex: 1; font-size: 0.75rem;">
                    Paste Syllabus
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

export function bindSubjectsEvents(container) {
  // Add Subject button
  const addBtn = container.querySelector('#btn-add-subject') || container.querySelector('#btn-empty-add-subject');
  if (addBtn) {
    addBtn.addEventListener('click', () => openSubjectModal());
  }

  // Edit Subject buttons
  container.querySelectorAll('.btn-edit-subject').forEach(btn => {
    btn.addEventListener('click', () => {
      const subjectId = btn.getAttribute('data-id');
      const subject = store.getState().subjects.find(s => s.id === subjectId);
      if (subject) openSubjectModal(subject);
    });
  });

  // Delete Subject buttons
  container.querySelectorAll('.btn-delete-subject').forEach(btn => {
    btn.addEventListener('click', async () => {
      const subjectId = btn.getAttribute('data-id');
      const subject = store.getState().subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const topicsCount = store.getState().topics.filter(t => t.subjectId === subjectId).length;
      const sessionsCount = store.getState().sessions.filter(s => s.subjectId === subjectId && s.status !== 'completed').length;

      const confirmed = await modal.confirm({
        title: `Delete "${subject.name}"?`,
        message: `This will permanently delete the subject along with ${topicsCount} syllabus topic(s) and cancel ${sessionsCount} future study session(s). Completed progress records will be preserved.`,
        confirmText: 'Delete Subject',
        danger: true
      });

      if (confirmed) {
        store.deleteSubject(subjectId);
        toast.info(`Deleted subject "${subject.name}".`);
      }
    });
  });

  // Add Topic button
  container.querySelectorAll('.btn-add-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const subjectId = btn.getAttribute('data-id');
      openAddTopicModal(subjectId);
    });
  });

  // Change topic status dropdown
  container.querySelectorAll('.select-topic-status').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const topicId = sel.getAttribute('data-id');
      const newStatus = e.target.value;
      store.updateTopic(topicId, { status: newStatus });
      toast.success('Topic status updated.');
    });
  });

  // Delete topic button
  container.querySelectorAll('.btn-delete-topic').forEach(btn => {
    btn.addEventListener('click', async () => {
      const topicId = btn.getAttribute('data-id');
      const topic = store.getState().topics.find(t => t.id === topicId);
      if (!topic) return;

      const confirmed = await modal.confirm({
        title: 'Delete Topic',
        message: `Are you sure you want to delete topic "${topic.title}"?`,
        confirmText: 'Delete',
        danger: true
      });

      if (confirmed) {
        store.deleteTopic(topicId);
        toast.info(`Topic "${topic.title}" removed.`);
      }
    });
  });

  // Syllabus import buttons
  container.querySelectorAll('.btn-import-syllabus, #btn-import-syllabus-global').forEach(btn => {
    btn.addEventListener('click', () => {
      const subjectId = btn.getAttribute('data-id') || (store.getState().subjects[0]?.id);
      openSyllabusImportModal(subjectId);
    });
  });
}

function openSubjectModal(existingSubject = null) {
  const isEdit = Boolean(existingSubject);
  const title = isEdit ? `Edit Subject: ${existingSubject.name}` : 'Create New Subject';

  const contentHtml = `
    <form id="subject-form">
      <div class="form-group">
        <label class="form-label" for="sub-name">Subject / Course Name *</label>
        <input class="form-input" id="sub-name" type="text" placeholder="e.g. Applied Physics" value="${existingSubject?.name || ''}" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="sub-desc">Description (optional)</label>
        <textarea class="form-textarea" id="sub-desc" placeholder="Brief course focus or textbook info">${existingSubject?.description || ''}</textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="sub-color">Card Accent Color</label>
          <input class="form-input" id="sub-color" type="color" value="${existingSubject?.color || '#10b981'}" style="height: 40px; padding: 2px;" />
        </div>

        <div class="form-group">
          <label class="form-label" for="sub-exam-date">Examination Date</label>
          <input class="form-input" id="sub-exam-date" type="date" value="${existingSubject?.examDate || ''}" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="sub-importance">Priority / Importance (1-5)</label>
          <select class="form-select" id="sub-importance">
            ${[1, 2, 3, 4, 5].map(i => `<option value="${i}" ${existingSubject?.importance === i || (!existingSubject && i === 4) ? 'selected' : ''}>${i} - ${i === 5 ? 'Critical' : i === 3 ? 'Standard' : i === 1 ? 'Low' : 'Important'}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="sub-prep">Current Preparedness (1-5)</label>
          <select class="form-select" id="sub-prep">
            ${[1, 2, 3, 4, 5].map(i => `<option value="${i}" ${existingSubject?.preparationLevel === i || (!existingSubject && i === 2) ? 'selected' : ''}>${i} - ${i === 1 ? 'Beginner' : i === 5 ? 'Well Prepared' : 'Intermediate'}</option>`).join('')}
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Cancel</button>
    <button class="btn btn-primary" id="btn-save-subject">${isEdit ? 'Save Changes' : 'Create Subject'}</button>
  `;

  modal.open({
    title,
    content: contentHtml,
    footer: footerHtml,
    size: 'medium',
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-save-subject').addEventListener('click', () => {
        const name = modalEl.querySelector('#sub-name').value.trim();
        if (!name) {
          toast.error('Please enter a subject name.');
          return;
        }

        const data = {
          name,
          description: modalEl.querySelector('#sub-desc').value.trim(),
          color: modalEl.querySelector('#sub-color').value,
          examDate: modalEl.querySelector('#sub-exam-date').value,
          importance: Number(modalEl.querySelector('#sub-importance').value),
          preparationLevel: Number(modalEl.querySelector('#sub-prep').value)
        };

        if (isEdit) {
          store.updateSubject(existingSubject.id, data);
          toast.success(`Updated subject "${name}".`);
        } else {
          store.addSubject(data);
          toast.success(`Added new subject "${name}".`);
        }
        modal.close();
      });
    }
  });
}

function openAddTopicModal(subjectId) {
  const contentHtml = `
    <form id="topic-form">
      <div class="form-group">
        <label class="form-label" for="topic-title">Topic Title *</label>
        <input class="form-input" id="topic-title" type="text" placeholder="e.g. Schrödinger Wave Equation" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="topic-unit">Unit / Chapter Title</label>
        <input class="form-input" id="topic-unit" type="text" placeholder="e.g. Unit 2: Quantum Physics" value="Unit 1: Core Topics" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="topic-diff">Difficulty</label>
          <select class="form-select" id="topic-diff">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="topic-mins">Estimated Minutes</label>
          <input class="form-input" id="topic-mins" type="number" min="15" max="240" step="15" value="45" />
        </div>
      </div>
    </form>
  `;

  modal.open({
    title: 'Add Syllabus Topic',
    content: contentHtml,
    footer: `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-topic">Add Topic</button>
    `,
    size: 'small',
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-save-topic').addEventListener('click', () => {
        const title = modalEl.querySelector('#topic-title').value.trim();
        if (!title) {
          toast.error('Please enter a topic title.');
          return;
        }

        store.addTopic({
          subjectId,
          title,
          unitTitle: modalEl.querySelector('#topic-unit').value.trim(),
          difficulty: modalEl.querySelector('#topic-diff').value,
          estimatedMinutes: Number(modalEl.querySelector('#topic-mins').value) || 45
        });

        modal.close();
        toast.success(`Topic "${title}" added.`);
      });
    }
  });
}

function openSyllabusImportModal(targetSubjectId) {
  const state = store.getState();
  const subjects = state.subjects || [];

  const sampleExample = `Unit 1: Wave Optics
- Interference Patterns
- Diffraction Grating
- Polarization

Unit 2: Quantum Physics
- Photoelectric effect
- de Broglie wavelength
- Schrödinger equation`;

  const contentHtml = `
    <div>
      <div class="form-group">
        <label class="form-label" for="import-target-subject">Select Target Subject</label>
        <select class="form-select" id="import-target-subject">
          ${subjects.map(s => `<option value="${s.id}" ${s.id === targetSubjectId ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="import-syllabus-text">Paste Raw Syllabus or Outline Text</label>
        <textarea class="form-textarea" id="import-syllabus-text" style="min-height: 180px; font-family: var(--font-mono); font-size: 0.8125rem;" placeholder="${sampleExample}"></textarea>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" id="btn-parse-rules" style="flex: 1;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          <span>Fast Rule-Based Parsing</span>
        </button>
        <button class="btn btn-primary" id="btn-parse-gemini" style="flex: 1;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          <span>Gemini AI Parsing</span>
        </button>
      </div>
    </div>
  `;

  modal.open({
    title: 'Import Course Syllabus',
    content: contentHtml,
    size: 'large',
    onOpen: (modalEl) => {
      const textarea = modalEl.querySelector('#import-syllabus-text');
      const subjectSelect = modalEl.querySelector('#import-target-subject');

      modalEl.querySelector('#btn-parse-rules').addEventListener('click', () => {
        const text = textarea.value.trim();
        if (!text) {
          toast.error('Please paste syllabus text first.');
          return;
        }
        const result = parseSyllabusRules(text);
        openParsedReviewModal(subjectSelect.value, result.units);
      });

      modalEl.querySelector('#btn-parse-gemini').addEventListener('click', async () => {
        const text = textarea.value.trim();
        if (!text) {
          toast.error('Please paste syllabus text first.');
          return;
        }

        const selectedSubject = subjects.find(s => s.id === subjectSelect.value);
        const subjectName = selectedSubject?.name || 'General';

        const parseBtn = modalEl.querySelector('#btn-parse-gemini');
        parseBtn.disabled = true;
        parseBtn.innerHTML = `<span class="spinner" style="width:14px;height:14px;"></span> Parsing with Gemini...`;

        try {
          const result = await apiClient.parseSyllabus(text, subjectName);
          openParsedReviewModal(subjectSelect.value, result.units || []);
        } catch (err) {
          toast.warning(`Gemini parsing failed (${err.message}). Falling back to rule-based parser.`);
          const fallback = parseSyllabusRules(text);
          openParsedReviewModal(subjectSelect.value, fallback.units);
        } finally {
          parseBtn.disabled = false;
          parseBtn.innerHTML = `<span>Gemini AI Parsing</span>`;
        }
      });
    }
  });
}

function openParsedReviewModal(subjectId, units) {
  if (!units || units.length === 0) {
    toast.warning('No topics were extracted. Check your syllabus formatting.');
    return;
  }

  const totalTopics = units.reduce((acc, u) => acc + (u.topics?.length || 0), 0);

  const contentHtml = `
    <div>
      <div style="margin-bottom: 1rem;">
        <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary);">
          Review &amp; Confirm Topics (${totalTopics} topics found)
        </h4>
        <p style="font-size: 0.8125rem; color: var(--text-muted);">
          Inspect the extracted units and topics below before adding them to your subject.
        </p>
      </div>

      <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem;">
        ${units.map((unit, uIdx) => `
          <div class="card" style="padding: 0.875rem 1rem;">
            <div style="font-weight: 700; font-size: 0.9375rem; color: var(--emerald-400); margin-bottom: 0.5rem;">
              ${unit.title || `Unit ${uIdx + 1}`}
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.375rem;">
              ${(unit.topics || []).map(t => `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; padding: 0.25rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <span><strong>${t.title}</strong></span>
                  <div style="display: flex; gap: 0.375rem;">
                    <span class="badge ${t.difficulty === 'hard' ? 'badge-rose' : t.difficulty === 'medium' ? 'badge-amber' : 'badge-emerald'}">${t.difficulty}</span>
                    <span class="badge badge-neutral">${t.estimatedMinutes}m</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.open({
    title: 'Syllabus Extraction Preview',
    content: contentHtml,
    footer: `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-close-btn').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-confirm-import">Confirm &amp; Save Topics</button>
    `,
    size: 'medium',
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-confirm-import').addEventListener('click', () => {
        store.addTopicsBatch(subjectId, units);
        modal.close();
        toast.success(`Successfully imported ${totalTopics} topic(s)!`);
      });
    }
  });
}
