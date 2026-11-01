import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { aiRouter } from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '500kb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'StudyPilot AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// AI Routes
app.use('/api/ai', aiRouter);

// Static Asset Serving
app.use('/src', express.static(path.join(rootDir, 'src')));
app.use('/docs', express.static(path.join(rootDir, 'docs')));

// Root & SPA Fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` }
    });
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Only listen if not imported as a test module
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 StudyPilot AI Server running at http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI Status: http://localhost:${PORT}/api/ai/status`);
    console.log(`======================================================\n`);
  });
}
