import { store } from '../state/store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { apiClient } from '../services/apiClient.js';
import { generateId } from '../utils/idGenerator.js';

export function renderSettings() {
  const state = store.getState();
  const prefs = state.profile?.preferences || {};
  const settings = state.settings || {};
  const dailyAvailability = prefs.dailyAvailability || {};

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return `
    <div>
      <div style="margin-bottom: 1.5rem;">
        <h2>Settings &amp; Preferences</h2>
        <p>Configure study availability windows, appearance, AI settings, and backup data.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 860px;">
        <!-- Appearance & Theme -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">Appearance</h3>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Choose your preferred color theme. Dark mode uses a charcoal palette with emerald highlights.
          </p>

          <div style="display: flex; gap: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.75rem 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface-elevated);">
              <input type="radio" name="app-theme" value="dark" ${settings.theme === 'dark' ? 'checked' : ''} />
              <span style="font-weight: 600;">Charcoal Dark (Default)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.75rem 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface-elevated);">
              <input type="radio" name="app-theme" value="light" ${settings.theme === 'light' ? 'checked' : ''} />
              <span style="font-weight: 600;">Clean Light</span>
            </label>
          </div>
        </div>

        <!-- Gemini AI Health & Status -->
        <div class="card" style="padding: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 700;">Google Gemini API Integration</h3>
            <span class="badge badge-emerald" id="badge-ai-model">${settings.geminiModel || 'gemini-2.5-flash'}</span>
          </div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">
            All AI operations run through your backend server via the official <code>@google/genai</code> SDK. The browser never receives or exposes your API key.
          </p>

          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <div style="font-weight: 600; font-size: 0.875rem;" id="ai-conn-status-title">Connection Status: Not Checked</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);" id="ai-conn-status-detail">Click below to perform an actual API handshake.</div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-test-ai-connection">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
            To configure your API key, create or edit <code>.env</code> in the project root:
            <pre style="background: var(--bg-secondary); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); margin-top: 0.375rem; font-family: var(--font-mono);">GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash</pre>
          </div>
        </div>

        <!-- Weekly Study Availability Builder -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">Weekly Study Availability</h3>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Specify your available study hours for each day of the week. You can add multiple separate time windows per day (e.g. morning and evening).
          </p>

          <div id="availability-builder-container">
            ${dayNames.map((dayName, dayIndex) => {
              const windows = dailyAvailability[dayIndex] || [];
              return `
                <div class="availability-day-row" data-day="${dayIndex}">
                  <div class="availability-day-label">${dayName}</div>
                  <div class="availability-windows" id="windows-day-${dayIndex}">
                    ${windows.length === 0 ? `
                      <span style="font-size: 0.8125rem; color: var(--text-muted); font-style: italic;">Unavailable (Rest Day)</span>
                    ` : windows.map((w, wIdx) => `
                      <div class="time-window-item" data-window-id="${w.id}">
                        <input type="time" class="form-input input-win-start" value="${w.startTime}" style="width: 120px;" />
                        <span style="color: var(--text-muted);">&rarr;</span>
                        <input type="time" class="form-input input-win-end" value="${w.endTime}" style="width: 120px;" />
                        <button class="btn btn-icon btn-remove-window" title="Remove Window" style="color: var(--rose-500);">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-sm btn-add-window" data-day="${dayIndex}" style="align-self: flex-start; font-size: 0.75rem; padding: 0.25rem 0.5rem; margin-top: 0.25rem;">
                      + Add Time Window
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top: 1.25rem; display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" id="btn-save-availability">Save Availability</button>
          </div>
        </div>

        <!-- Study Preferences -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">Study Parameters</h3>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Default session lengths, break intervals, and daily caps enforced by the scheduler.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="pref-session-duration">Session Duration</label>
              <select class="form-select" id="pref-session-duration">
                <option value="30" ${prefs.defaultSessionDuration === 30 ? 'selected' : ''}>30 minutes</option>
                <option value="45" ${prefs.defaultSessionDuration === 45 ? 'selected' : ''}>45 minutes (Recommended)</option>
                <option value="60" ${prefs.defaultSessionDuration === 60 ? 'selected' : ''}>60 minutes</option>
                <option value="90" ${prefs.defaultSessionDuration === 90 ? 'selected' : ''}>90 minutes</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="pref-break-duration">Mandatory Break</label>
              <select class="form-select" id="pref-break-duration">
                <option value="5" ${prefs.defaultBreakDuration === 5 ? 'selected' : ''}>5 minutes</option>
                <option value="10" ${prefs.defaultBreakDuration === 10 ? 'selected' : ''}>10 minutes (Optimal)</option>
                <option value="15" ${prefs.defaultBreakDuration === 15 ? 'selected' : ''}>15 minutes</option>
                <option value="20" ${prefs.defaultBreakDuration === 20 ? 'selected' : ''}>20 minutes</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="pref-max-hours">Max Daily Hours</label>
              <select class="form-select" id="pref-max-hours">
                ${[3, 4, 5, 6, 7, 8, 10].map(h => `
                  <option value="${h}" ${prefs.maxDailyHours === h ? 'selected' : ''}>${h} hours/day</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
            <button class="btn btn-primary" id="btn-save-params">Update Parameters</button>
          </div>
        </div>

        <!-- Data Backup & Reset -->
        <div class="card" style="padding: 1.5rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">Data Portability &amp; Backups</h3>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">
            All your academic syllabi, notes, sessions, and progress reside safely in your browser's local storage.
          </p>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-export-backup">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Export JSON Backup</span>
            </button>

            <label class="btn btn-secondary" style="cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>Import Backup JSON</span>
              <input type="file" id="input-import-file" accept=".json" style="display: none;" />
            </label>

            <button class="btn btn-danger" id="btn-reset-data">
              <span>Reset All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindSettingsEvents(container) {
  // Theme Switcher
  container.querySelectorAll('input[name="app-theme"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selected = e.target.value;
      store.setTheme(selected);
      toast.success(`Theme switched to ${selected} mode.`);
    });
  });

  // Test AI Connection button
  const testAiBtn = container.querySelector('#btn-test-ai-connection');
  const titleEl = container.querySelector('#ai-conn-status-title');
  const detailEl = container.querySelector('#ai-conn-status-detail');

  testAiBtn?.addEventListener('click', async () => {
    testAiBtn.disabled = true;
    testAiBtn.innerHTML = `<span class="spinner" style="width:12px;height:12px;"></span> Pinging Gemini...`;
    titleEl.textContent = 'Testing connection...';
    titleEl.style.color = 'var(--text-primary)';

    try {
      const res = await apiClient.testAiConnection();
      if (res.connected) {
        titleEl.textContent = 'Connected: Google Gemini API is Ready';
        titleEl.style.color = 'var(--emerald-400)';
        detailEl.textContent = `${res.message} (${res.latencyMs}ms)`;
        toast.success('Gemini API is connected and responding!');
      } else {
        titleEl.textContent = `Status: ${res.status || 'Not Connected'}`;
        titleEl.style.color = 'var(--rose-500)';
        detailEl.textContent = res.message;
        toast.warning(res.message);
      }
    } catch (err) {
      titleEl.textContent = 'Status: Network or Service Error';
      titleEl.style.color = 'var(--rose-500)';
      detailEl.textContent = err.message;
      toast.error(err.message);
    } finally {
      testAiBtn.disabled = false;
      testAiBtn.innerHTML = `<span>Test Connection</span>`;
    }
  });

  // Save Parameters
  container.querySelector('#btn-save-params')?.addEventListener('click', () => {
    const sessionDuration = Number(container.querySelector('#pref-session-duration').value);
    const breakDuration = Number(container.querySelector('#pref-break-duration').value);
    const maxDailyHours = Number(container.querySelector('#pref-max-hours').value);

    store.updatePreferences({
      defaultSessionDuration: sessionDuration,
      defaultBreakDuration: breakDuration,
      maxDailyHours
    });
    toast.success('Study parameters updated.');
  });

  // Add Time Window buttons
  container.querySelectorAll('.btn-add-window').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayIndex = btn.getAttribute('data-day');
      const windowsContainer = container.querySelector(`#windows-day-${dayIndex}`);
      const newWindowItem = document.createElement('div');
      newWindowItem.className = 'time-window-item';
      newWindowItem.setAttribute('data-window-id', generateId());
      newWindowItem.innerHTML = `
        <input type="time" class="form-input input-win-start" value="18:00" style="width: 120px;" />
        <span style="color: var(--text-muted);">&rarr;</span>
        <input type="time" class="form-input input-win-end" value="21:00" style="width: 120px;" />
        <button class="btn btn-icon btn-remove-window" title="Remove Window" style="color: var(--rose-500);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      newWindowItem.querySelector('.btn-remove-window').addEventListener('click', () => {
        newWindowItem.remove();
      });

      windowsContainer.insertBefore(newWindowItem, btn);
    });
  });

  // Remove window buttons
  container.querySelectorAll('.btn-remove-window').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.time-window-item').remove();
    });
  });

  // Save Availability button
  container.querySelector('#btn-save-availability')?.addEventListener('click', () => {
    const dailyAvailability = {};

    container.querySelectorAll('.availability-day-row').forEach(row => {
      const dayIndex = Number(row.getAttribute('data-day'));
      const windows = [];

      row.querySelectorAll('.time-window-item').forEach(winEl => {
        const id = winEl.getAttribute('data-window-id') || generateId();
        const start = winEl.querySelector('.input-win-start').value;
        const end = winEl.querySelector('.input-win-end').value;

        if (start && end && start < end) {
          windows.push({ id, startTime: start, endTime: end });
        }
      });

      dailyAvailability[dayIndex] = windows;
    });

    store.updatePreferences({ dailyAvailability });
    toast.success('Weekly availability schedule saved successfully.');
  });

  // Export JSON Backup
  container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
    const jsonStr = store.exportBackup ? store.exportBackup() : JSON.stringify(store.getState(), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studypilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup JSON exported successfully.');
  });

  // Import JSON Backup
  const fileInput = container.querySelector('#input-import-file');
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target.result;
        const confirmed = await modal.confirm({
          title: 'Import Backup File',
          message: 'Importing will replace your current schedule and subjects with the backup contents. Are you sure you wish to proceed?',
          confirmText: 'Import & Replace'
        });

        if (confirmed) {
          store.importBackup(jsonContent);
          toast.success('Backup imported successfully!');
          window.location.reload();
        }
      } catch (err) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  });

  // Reset Application Data
  container.querySelector('#btn-reset-data')?.addEventListener('click', async () => {
    const confirmed = await modal.confirm({
      title: 'Reset StudyPilot Workspace?',
      message: 'This will reset all your subjects, topics, and study plans back to default initial seed data. This action cannot be undone.',
      confirmText: 'Reset Everything',
      danger: true
    });

    if (confirmed) {
      store.resetAll();
      toast.info('Workspace reset to initial defaults.');
      window.location.reload();
    }
  });
}
