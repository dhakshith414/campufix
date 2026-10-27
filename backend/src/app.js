require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to configured origin
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile, curl, Postman in dev)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check — no auth, no secrets
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    success: true,
    service: 'CampusFix API',
    version: '1.0.0',
    status: 'operational',
    database: dbState[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
