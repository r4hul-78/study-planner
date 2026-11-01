import { store } from './state/store.js';
import { router } from './router.js';
import { checkAndTriggerOnboarding } from './pages/onboardingModal.js';

document.addEventListener('DOMContentLoaded', () => {
  const state = store.getState();

  // 1. Initialize Theme
  const currentTheme = state.settings?.theme || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // 2. Hydrate Sidebar Profile
  updateSidebarProfile(state);

  // 3. Theme Toggle Button
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  themeToggleBtn?.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    store.setTheme(nextTheme);
  });

  // 4. Header Quick Plan Button
  const quickPlanBtn = document.getElementById('btn-quick-plan');
  quickPlanBtn?.addEventListener('click', () => {
    window.location.hash = '#/planner';
  });

  // 5. Mobile Hamburger Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('app-sidebar');
  mobileMenuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // 6. Subscribe to store changes to keep profile in sync
  store.subscribe((nextState) => {
    updateSidebarProfile(nextState);
  });

  // 7. Check Onboarding
  checkAndTriggerOnboarding();

  // 8. Start Router
  router.init();
});

function updateSidebarProfile(state) {
  const nameEl = document.getElementById('sidebar-student-name');
  const levelEl = document.getElementById('sidebar-academic-level');
  const avatarEl = document.getElementById('sidebar-avatar');

  const name = state.profile?.displayName || 'Student Pilot';
  const level = state.profile?.academicLevel || 'Undergraduate';

  if (nameEl) nameEl.textContent = name;
  if (levelEl) levelEl.textContent = level;
  if (avatarEl) {
    const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SP';
    avatarEl.textContent = initials;
  }
}
