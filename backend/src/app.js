require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// ─── Trust Proxy (Aman di belakang reverse proxy seperti NGINX) ─
if (process.env.TRUST_PROXY !== undefined) {
  const trustVal = process.env.TRUST_PROXY;
  app.set('trust proxy', trustVal === 'true' ? true : (!isNaN(trustVal) ? parseInt(trustVal, 10) : trustVal));
} else {
  app.set('trust proxy', 1);
}

// ─── Security & Utility Middleware ──────────────────────────────
app.use(helmet());

// CORS: Hindari wildcard '*' dan batasi origin dari env (dukung multi-origin jika dipisah koma)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin !== '*');

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (misal curl, mobile app) atau origin yang cocok
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS.`));
  },
  credentials: true,
}));

// Body size limit: batasi 2mb (mencegah DoS payload besar)
app.use(express.json({ limit: process.env.BODY_LIMIT || '2mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '2mb' }));

// Custom morgan token untuk menyensor query string dan Authorization header
morgan.token('safe-url', (req) => {
  try {
    const parsedUrl = new URL(req.originalUrl || req.url, 'http://localhost');
    if (parsedUrl.searchParams.has('token')) {
      parsedUrl.searchParams.set('token', '[REDACTED]');
    }
    return parsedUrl.pathname + parsedUrl.search;
  } catch {
    return req.originalUrl || req.url;
  }
});

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :safe-url :status :res[content-length] - :response-time ms'));
}

// Rate limiting
app.use('/api', apiLimiter);

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handling ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
