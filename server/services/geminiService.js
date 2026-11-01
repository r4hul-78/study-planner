import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * GeminiService handles all communication with Google's hosted Gemini API.
 * Keeps API keys exclusively on the backend and enforces structured output schemas.
 */
class GeminiService {
  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    dotenv.config();
    this.apiKey = (process.env.GEMINI_API_KEY || '').trim();
    this.modelName = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.error('[GeminiService] Failed to initialize GoogleGenAI client:', err.message);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  isConfigured() {
    this.refreshConfig();
    return Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here');
  }

  getModelName() {
    this.refreshConfig();
    return this.modelName;
  }

  getClient() {
    this.refreshConfig();
    return this.client;
  }

  /**
   * Tests actual connectivity to the Gemini API with a minimal prompt.
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        connected: false,
        status: 'not_configured',
        message: 'GEMINI_API_KEY is not configured in backend .env file.'
      };
    }

    const client = this.getClient();
    if (!client) {
      return {
        connected: false,
        status: 'not_configured',
        message: 'Could not initialize GoogleGenAI client.'
      };
    }

    const startTime = Date.now();
    try {
      let response;
      try {
        response = await client.models.generateContent({
          model: this.modelName,
          contents: 'Ping test. Reply with the single word "READY".',
          config: {
            maxOutputTokens: 10,
            temperature: 0.1
          }
        });
      } catch (err) {
        if ((err.message?.includes('NOT_FOUND') || err.message?.includes('not found') || err.status === 404) && this.modelName !== 'gemini-2.5-flash') {
          console.warn(`[GeminiService] Model "${this.modelName}" not found. Falling back to "gemini-2.5-flash"`);
          this.modelName = 'gemini-2.5-flash';
          response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Ping test. Reply with the single word "READY".',
            config: {
              maxOutputTokens: 10,
              temperature: 0.1
            }
          });
        } else {
          throw err;
        }
      }

      const latencyMs = Date.now() - startTime;
      const text = response.text ? response.text.trim() : '';

      return {
        connected: true,
        status: 'connected',
        model: this.modelName,
        latencyMs,
        message: `Successfully connected to Gemini API (${this.modelName}) in ${latencyMs}ms. Response: "${text}"`
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      return this.handleApiError(err, latencyMs);
    }
  }

  /**
   * Parses unstructured syllabus text into structured units, topics, and subtopics.
   */
  async parseSyllabus(rawText, subjectName = 'General') {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured on the backend.');
    }

    const client = this.getClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not configured on the backend.');
    }

    const prompt = `You are an expert academic curriculum parser.
Parse the following syllabus for the course "${subjectName}" into structured units and topics.
For each topic, estimate study duration in minutes (between 30 and 120 minutes) and assign difficulty ("easy", "medium", or "hard").

SYLLABUS CONTENT:
${rawText.slice(0, 8000)}`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              units: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Unit or Chapter title' },
                    topics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING, description: 'Topic name' },
                          description: { type: Type.STRING, description: 'Brief 1-sentence topic summary' },
                          difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                          estimatedMinutes: { type: Type.INTEGER, description: 'Estimated study minutes, e.g. 45 or 60' }
                        },
                        required: ['title', 'difficulty', 'estimatedMinutes']
                      }
                    }
                  },
                  required: ['title', 'topics']
                }
              }
            },
            required: ['units']
          }
        }
      });

      const parsed = JSON.parse(response.text);
      return parsed;
    } catch (err) {
      console.error('[GeminiService.parseSyllabus] Error:', err.message);
      throw this.normalizeError(err);
    }
  }

  /**
   * Generates AI pedagogical strategy recommendations for study session ordering.
   */
  async generateStrategyAdvice({ subjects, pendingTopics, horizonDays }) {
    if (!this.isConfigured()) {
      return {
        strategy: 'Standard spaced progression',
        recommendations: ['Focus on upcoming exam subjects first', 'Review weak areas earlier in the day']
      };
    }

    if (!this.client) this.initClient();

    const summaryTopics = (pendingTopics || []).slice(0, 15).map(t => ({
      title: t.title,
      subject: t.subjectName,
      difficulty: t.difficulty,
      confidence: t.confidence
    }));

    const prompt = `Act as an academic strategy coach. Given ${horizonDays} days of study horizon and the following pending topics:
${JSON.stringify(summaryTopics, null, 2)}

Provide pedagogical recommendations for session planning.
Return a structured JSON with:
- strategySummary: 2-3 sentence overview of recommended study sequence
- highPriorityTopics: list of topic titles that should be tackled first
- suggestedBreakdowns: list of tips for breaking difficult topics into manageable tasks`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              strategySummary: { type: Type.STRING },
              highPriorityTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedBreakdowns: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['strategySummary', 'highPriorityTopics', 'suggestedBreakdowns']
          }
        }
      });

      return JSON.parse(response.text);
    } catch (err) {
      console.warn('[GeminiService.generateStrategyAdvice] Non-blocking fallback:', err.message);
      return {
        strategySummary: 'Prioritize upcoming exams and high difficulty topics with low confidence ratings.',
        highPriorityTopics: summaryTopics.filter(t => t.confidence <= 2).map(t => t.title),
        suggestedBreakdowns: ['Study core theoretical concepts before practicing problem sets.']
      };
    }
  }

  /**
   * Interactive multi-turn study assistant.
   */
  async studyAssistant({ message, history = [], context = {} }) {
    const client = this.getClient();
    if (!client) {
      throw new Error('Gemini API is not configured on the backend. Please add your GEMINI_API_KEY in Settings or server/.env.');
    }

    // Contextual system prompt
    let systemInstruction = `You are StudyPilot AI, a brilliant, calm, encouraging academic mentor.
Help students master complex concepts, formulate revision plans, generate practice problems, and overcome study obstacles.
Format formulas, lists, and code with clean Markdown.
Keep responses concise, actionable, and student-friendly. Never claim you can guarantee exam marks or pass rates.`;

    if (context.subjectName) {
      systemInstruction += `\nCurrent Subject Context: ${context.subjectName}`;
    }
    if (context.topicTitle) {
      systemInstruction += `\nCurrent Topic Context: ${context.topicTitle} (Difficulty: ${context.difficulty || 'medium'}, Confidence: ${context.confidence || 3}/5)`;
    }
    if (context.examCountdown !== undefined) {
      systemInstruction += `\nDays until exam: ${context.examCountdown} days`;
    }

    // Convert past messages into contents
    const contents = [];
    // Only include recent history to keep context clean
    const recentHistory = (history || []).slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || msg.content }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      });

      const replyText = response.text || 'I could not generate an answer at this time.';
      return {
        reply: replyText,
        model: this.modelName
      };
    } catch (err) {
      console.error('[GeminiService.studyAssistant] Error:', err.message);
      throw this.normalizeError(err);
    }
  }

  /**
   * Normalizes errors into structured, client-friendly error objects.
   */
  handleApiError(err, latencyMs = 0) {
    const msg = err.message || '';
    if (msg.includes('API_KEY_INVALID') || msg.includes('unregistered') || msg.includes('401') || msg.includes('403')) {
      return {
        connected: false,
        status: 'invalid_credentials',
        latencyMs,
        message: 'Invalid Gemini API key. Please check your credentials in Google AI Studio.'
      };
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota')) {
      return {
        connected: false,
        status: 'quota_exceeded',
        latencyMs,
        message: 'Gemini API rate limit or quota exceeded. Please wait a few moments or check your billing plan.'
      };
    }
    if (msg.includes('NOT_FOUND') || msg.includes('model')) {
      return {
        connected: false,
        status: 'model_unavailable',
        latencyMs,
        message: `Model "${this.modelName}" is currently unavailable or unsupported.`
      };
    }
    return {
      connected: false,
      status: 'network_error',
      latencyMs,
      message: `Failed to connect to Gemini API: ${msg}`
    };
  }

  normalizeError(err) {
    const error = new Error(err.message || 'Gemini API request failed');
    if (err.status) error.statusCode = err.status;
    else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) error.statusCode = 429;
    else if (err.message?.includes('401') || err.message?.includes('403')) error.statusCode = 401;
    else error.statusCode = 500;
    return error;
  }
}

export const geminiService = new GeminiService();
