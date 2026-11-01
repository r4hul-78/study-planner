import { store } from '../state/store.js';
import { calculateProgressMetrics } from '../services/progressService.js';

let activeCharts = [];

export function renderAnalytics() {
  const state = store.getState();
  const metrics = calculateProgressMetrics(state);

  return `
    <div>
      <div style="margin-bottom: 1.5rem;">
        <h2>Progress &amp; Academic Analytics</h2>
        <p>Evidence-based insights into your syllabus completion, focus habits, and examination readiness.</p>
      </div>

      <!-- Top Metric Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card">
          <div class="stat-header"><span>Overall Syllabus</span></div>
          <div class="stat-value text-emerald">${metrics.overallCompletionPercentage}%</div>
          <div class="stat-subtext">${metrics.completedTopics} of ${metrics.totalTopics} topics completed</div>
        </div>

        <div class="stat-card">
          <div class="stat-header"><span>Study Time Logged</span></div>
          <div class="stat-value text-teal">${metrics.totalStudyHours}h</div>
          <div class="stat-subtext">Planned: ${(metrics.totalPlannedMinutes / 60).toFixed(1)}h</div>
        </div>

        <div class="stat-card">
          <div class="stat-header"><span>Exam Readiness Index</span></div>
          <div class="stat-value" style="color: ${metrics.readiness.color};">${metrics.readiness.score}%</div>
          <div class="stat-subtext">${metrics.readiness.label}</div>
        </div>

        <div class="stat-card">
          <div class="stat-header"><span>Critical Focus Topics</span></div>
          <div class="stat-value text-amber">${metrics.weakTopics.length}</div>
          <div class="stat-subtext">Require review or practice</div>
        </div>
      </div>

      <!-- Exam Readiness Breakdown Card -->
      <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
            Examination Readiness Diagnostic
          </h3>
          <span class="badge" style="background: ${metrics.readiness.color}20; color: ${metrics.readiness.color}; border: 1px solid ${metrics.readiness.color}40;">
            ${metrics.readiness.label} (${metrics.readiness.score}%)
          </span>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
          ${metrics.readiness.description}
        </p>

        ${metrics.readiness.status === 'calculated' ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
            <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Syllabus Coverage Factor</div>
              <div style="font-weight: 700; font-size: 1.125rem; color: var(--text-primary);">${metrics.readiness.factors.coverageRatio}%</div>
            </div>
            <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Average Topic Confidence</div>
              <div style="font-weight: 700; font-size: 1.125rem; color: var(--emerald-400);">${metrics.readiness.factors.avgConfidence} / 5.0</div>
            </div>
            <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Revision Backlog Penalty</div>
              <div style="font-weight: 700; font-size: 1.125rem; color: var(--rose-500);">${metrics.readiness.factors.revisionBacklogCount} topics</div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Charts Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="card" style="padding: 1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Subject-wise Syllabus Coverage</h3>
          <div style="position: relative; height: 260px;">
            <canvas id="chart-subject-coverage"></canvas>
          </div>
        </div>

        <div class="card" style="padding: 1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Planned vs. Actual Study Time (Hours)</h3>
          <div style="position: relative; height: 260px;">
            <canvas id="chart-time-comparison"></canvas>
          </div>
        </div>
      </div>

      <!-- Weak Topics Radar List -->
      <div class="card" style="padding: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.125rem; font-weight: 700;">Weak Topics Diagnostic Radar</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">
              Topics with low reported confidence (≤ 2/5) or marked "Needs Revision".
            </p>
          </div>
          <span class="badge badge-amber">${metrics.weakTopics.length} identified</span>
        </div>

        ${metrics.weakTopics.length === 0 ? `
          <div class="empty-state" style="padding: 1.5rem 0;">
            <div style="font-weight: 600; color: var(--emerald-400);">No weak topics detected!</div>
            <div style="font-size: 0.8125rem; color: var(--text-secondary);">Your reported confidence ratings are consistently solid across all courses.</div>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.625rem;">
            ${metrics.weakTopics.map(topic => `
              <div style="padding: 0.75rem 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface-elevated); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="badge" style="background: ${topic.subjectColor}20; color: ${topic.subjectColor};">
                      ${topic.subjectName}
                    </span>
                    <span style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${topic.title}</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                    Confidence: <strong>${topic.confidence || 1}/5</strong> • Difficulty: <strong>${topic.difficulty}</strong> • Est: ${topic.estimatedMinutes}m
                  </div>
                </div>

                <a href="#/assistant" class="btn btn-outline btn-sm btn-ask-tutor" data-topic="${topic.title}" data-subject="${topic.subjectName}" style="font-size: 0.75rem; padding: 0.25rem 0.625rem;">
                  <span>Ask AI Tutor &rarr;</span>
                </a>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

export function bindAnalyticsEvents(container) {
  // Clean up any previous Chart.js instances to avoid memory leaks
  activeCharts.forEach(c => c.destroy());
  activeCharts = [];

  const state = store.getState();
  const metrics = calculateProgressMetrics(state);

  // Initialize Chart.js charts if library is loaded
  if (typeof Chart !== 'undefined') {
    // 1. Subject Coverage Chart
    const coverageCanvas = container.querySelector('#chart-subject-coverage');
    if (coverageCanvas) {
      const subjectLabels = metrics.subjectMetrics.map(s => s.name);
      const coverageData = metrics.subjectMetrics.map(s => s.completionPercentage);
      const colors = metrics.subjectMetrics.map(s => s.color || '#10b981');

      const coverageChart = new Chart(coverageCanvas, {
        type: 'bar',
        data: {
          labels: subjectLabels,
          datasets: [{
            label: 'Completion %',
            data: coverageData,
            backgroundColor: colors,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8' }
            }
          }
        }
      });
      activeCharts.push(coverageChart);
    }

    // 2. Planned vs Actual Time Chart
    const timeCanvas = container.querySelector('#chart-time-comparison');
    if (timeCanvas) {
      const plannedHours = (metrics.totalPlannedMinutes / 60);
      const actualHours = (metrics.totalActualMinutes / 60);

      const timeChart = new Chart(timeCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Actual Productive Hours', 'Planned Remaining Hours'],
          datasets: [{
            data: [Number(actualHours.toFixed(1)), Number(Math.max(0, plannedHours - actualHours).toFixed(1))],
            backgroundColor: ['#10b981', '#1e2b42'],
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', font: { family: 'Outfit' } }
            }
          }
        }
      });
      activeCharts.push(timeChart);
    }
  }
}
