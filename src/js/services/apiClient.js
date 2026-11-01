/**
 * API client for communicating with the StudyPilot Express backend.
 */
class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.timeoutMs = 30000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `API request failed with status ${response.status}`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The server or Gemini API took too long to respond.');
      }
      throw err;
    }
  }

  async checkHealth() {
    return this.request('/api/health', { timeoutMs: 5000 });
  }

  async getAiStatus() {
    return this.request('/api/ai/status', { timeoutMs: 5000 });
  }

  async testAiConnection() {
    return this.request('/api/ai/test-connection', {
      method: 'POST',
      body: JSON.stringify({}),
      timeoutMs: 15000
    });
  }

  async parseSyllabus(text, subjectName) {
    return this.request('/api/ai/parse-syllabus', {
      method: 'POST',
      body: JSON.stringify({ text, subjectName }),
      timeoutMs: 25000
    });
  }

  async generatePlanStrategy(subjects, pendingTopics, horizonDays) {
    return this.request('/api/ai/generate-study-plan', {
      method: 'POST',
      body: JSON.stringify({ subjects, pendingTopics, horizonDays }),
      timeoutMs: 25000
    });
  }

  async askStudyAssistant(message, history = [], context = {}) {
    return this.request('/api/ai/study-assistant', {
      method: 'POST',
      body: JSON.stringify({ message, history, context }),
      timeoutMs: 25000
    });
  }
}

export const apiClient = new ApiClient();
