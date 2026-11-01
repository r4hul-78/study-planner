import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { store } from '../state/store.js';

export function checkAndTriggerOnboarding() {
  const state = store.getState();
  if (state.profile?.onboardingCompleted) return;

  const contentHtml = `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div>
        <h3 style="font-size: 1.375rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.375rem;">
          Welcome to StudyPilot AI 👋
        </h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">
          Let's tailor your academic OS in 30 seconds. You can always adjust these preferences later in Settings.
        </p>
      </div>

      <div class="form-group">
        <label class="form-label" for="onboarding-name">What should we call you?</label>
        <input class="form-input" id="onboarding-name" type="text" placeholder="e.g. Aditya Raj" value="${state.profile?.displayName || ''}" />
      </div>

      <div class="form-group">
        <label class="form-label" for="onboarding-level">Current Academic Level</label>
        <select class="form-select" id="onboarding-level">
          <option value="High School">High School / Prep</option>
          <option value="Undergraduate" selected>Undergraduate Degree</option>
          <option value="Graduate">Graduate / Masters</option>
          <option value="Certification">Professional Certification</option>
          <option value="Self Study">Self-Directed Study</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="onboarding-course">Course / Target Field</label>
        <input class="form-input" id="onboarding-course" type="text" placeholder="e.g. Computer Science, Engineering, Medicine" value="${state.profile?.course || ''}" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="onboarding-session-mins">Preferred Session Length</label>
          <select class="form-select" id="onboarding-session-mins">
            <option value="30">30 minutes</option>
            <option value="45" selected>45 minutes (Optimal)</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="onboarding-max-hours">Max Daily Study Hours</label>
          <select class="form-select" id="onboarding-max-hours">
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
            <option value="5" selected>5 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
          </select>
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" id="btn-skip-onboarding">Skip for Now</button>
    <button class="btn btn-primary" id="btn-complete-onboarding">Let's Get Started</button>
  `;

  modal.open({
    title: 'Personalize Your StudyPilot',
    content: contentHtml,
    footer: footerHtml,
    size: 'medium',
    onOpen: (modalEl) => {
      const skipBtn = modalEl.querySelector('#btn-skip-onboarding');
      const completeBtn = modalEl.querySelector('#btn-complete-onboarding');

      skipBtn.addEventListener('click', () => {
        store.updateProfile({ onboardingCompleted: true });
        modal.close();
        toast.info('You can update your profile anytime in Settings.');
      });

      completeBtn.addEventListener('click', () => {
        const name = modalEl.querySelector('#onboarding-name').value.trim() || 'Student Pilot';
        const level = modalEl.querySelector('#onboarding-level').value;
        const course = modalEl.querySelector('#onboarding-course').value.trim() || 'General Studies';
        const sessionMins = Number(modalEl.querySelector('#onboarding-session-mins').value);
        const maxHours = Number(modalEl.querySelector('#onboarding-max-hours').value);

        store.updateProfile({
          displayName: name,
          academicLevel: level,
          course: course,
          onboardingCompleted: true
        });

        store.updatePreferences({
          defaultSessionDuration: sessionMins,
          maxDailyHours: maxHours
        });

        modal.close();
        toast.success(`Welcome aboard, ${name}! Your profile is ready.`);
      });
    }
  });
}
