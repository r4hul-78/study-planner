import express from 'express';
import { geminiService } from '../services/geminiService.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

export const aiRouter = express.Router();
const aiLimiter = createRateLimiter(40, 60 * 1000);

/**
 * GET /api/ai/status
 * Returns current AI service readiness without leaking credentials.
 */
aiRouter.get('/status', (req, res) => {
  res.json({
    configured: geminiService.isConfigured(),
    model: geminiService.getModelName()
  });
});

/**
 * POST /api/ai/test-connection
 * Actively triggers a test ping to Google Gemini API.
 */
aiRouter.post('/test-connection', aiLimiter, async (req, res) => {
  try {
    const result = await geminiService.testConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      connected: false,
      status: 'error',
      message: err.message || 'Internal error during connection test'
    });
  }
});

/**
 * POST /api/ai/parse-syllabus
 * Parses raw syllabus text into structured units and topics.
 */
aiRouter.post('/parse-syllabus', aiLimiter, async (req, res, next) => {
  try {
    const { text, subjectName } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Syllabus text is required and cannot be empty.'
        }
      });
    }

    if (text.length > 20000) {
      return res.status(400).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Syllabus text exceeds the 20,000 character limit.'
        }
      });
    }

    const parsed = await geminiService.parseSyllabus(text, subjectName);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/generate-study-plan
 * Provides pedagogical strategy recommendations for study session ordering.
 */
aiRouter.post('/generate-study-plan', aiLimiter, async (req, res, next) => {
  try {
    const { subjects, pendingTopics, horizonDays } = req.body;
    const strategy = await geminiService.generateStrategyAdvice({
      subjects: subjects || [],
      pendingTopics: pendingTopics || [],
      horizonDays: horizonDays || 7
    });
    res.json(strategy);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/study-assistant
 * Interactive multi-turn study tutor & conceptual assistant.
 */
aiRouter.post('/study-assistant', aiLimiter, async (req, res, next) => {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Prompt message is required.'
        }
      });
    }

    const result = await geminiService.studyAssistant({
      message: message.trim(),
      history: history || [],
      context: context || {}
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
