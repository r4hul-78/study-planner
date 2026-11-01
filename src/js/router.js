import { renderDashboard, bindDashboardEvents } from './pages/dashboardPage.js';
import { renderSubjects, bindSubjectsEvents } from './pages/subjectsPage.js';
import { renderPlanner, bindPlannerEvents } from './pages/plannerPage.js';
import { renderCalendar, bindCalendarEvents } from './pages/calendarPage.js';
import { renderAnalytics, bindAnalyticsEvents } from './pages/analyticsPage.js';
import { renderAssistant, bindAssistantEvents } from './pages/assistantPage.js';
import { renderSettings, bindSettingsEvents } from './pages/settingsPage.js';

const routes = {
  '#/dashboard': {
    title: 'Dashboard',
    subtitle: 'Welcome back to your study cockpit',
    render: renderDashboard,
    bind: bindDashboardEvents,
    navId: 'nav-dashboard'
  },
  '#/subjects': {
    title: 'My Subjects',
    subtitle: 'Courses, units, and topic breakdowns',
    render: renderSubjects,
    bind: bindSubjectsEvents,
    navId: 'nav-subjects'
  },
  '#/planner': {
    title: 'Study Planner',
    subtitle: 'Intelligent schedule allocation & adaptive rescheduling',
    render: renderPlanner,
    bind: bindPlannerEvents,
    navId: 'nav-planner'
  },
  '#/calendar': {
    title: 'Calendar',
    subtitle: 'Month grid, weekly horizon, and agenda list',
    render: renderCalendar,
    bind: bindCalendarEvents,
    navId: 'nav-calendar'
  },
  '#/analytics': {
    title: 'Progress & Analytics',
    subtitle: 'Evidence-based insights into your learning velocity',
    render: renderAnalytics,
    bind: bindAnalyticsEvents,
    navId: 'nav-analytics'
  },
  '#/assistant': {
    title: 'AI Study Assistant',
    subtitle: 'Interactive pedagogical tutoring powered by Google Gemini',
    render: renderAssistant,
    bind: bindAssistantEvents,
    navId: 'nav-assistant'
  },
  '#/settings': {
    title: 'Settings',
    subtitle: 'Weekly availability, appearance, AI connection, and backups',
    render: renderSettings,
    bind: bindSettingsEvents,
    navId: 'nav-settings'
  }
};

class Router {
  constructor() {
    this.currentHash = '';
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    if (!window.location.hash || !routes[window.location.hash]) {
      window.location.hash = '#/dashboard';
    } else {
      this.handleRoute();
    }
  }

  handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const route = routes[hash] || routes['#/dashboard'];
    this.currentHash = hash;

    const appView = document.getElementById('app-view');
    const headingEl = document.getElementById('page-heading');
    const subheadingEl = document.getElementById('page-subheading');

    if (headingEl) headingEl.textContent = route.title;
    if (subheadingEl) subheadingEl.textContent = route.subtitle;

    // Update active nav styling
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
    const activeNavEl = document.getElementById(route.navId);
    if (activeNavEl) activeNavEl.classList.add('active');

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Render View
    if (appView) {
      appView.innerHTML = route.render();
      if (typeof route.bind === 'function') {
        route.bind(appView);
      }
    }

    // Refresh icons
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }

    // Scroll to top of content
    window.scrollTo(0, 0);
  }

  navigate(hash) {
    window.location.hash = hash;
  }
}

export const router = new Router();
