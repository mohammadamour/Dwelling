import * as dotenv from 'dotenv';
dotenv.config();
import express = require('express');
import cors = require('cors');
import { PrismaClient } from '@prisma/client';
import { getAllowedOrigins, PORT, NODE_ENV } from './config/env';
import propertyRoutes = require('./routes/propertyRoutes');
import statsRoutes = require('./routes/stats');
import authRoutes = require('./routes/auth');
import userRoutes = require('./routes/userRoutes');
import favoriteRoutes = require('./routes/favoriteRoutes');
import tourRoutes = require('./routes/tourRoutes');
import agentRoutes = require('./routes/agentRoutes');

const prisma = new PrismaClient();
const app = express();

// Security: Dynamic CORS configuration based on environment variables
const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Whitelist check
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In non-production environments, allow local development ports
    if (NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// Make prisma available to routes via request object
app.use((req, _res, next) => {
  (req as any).prisma = prisma;
  next();
});

// Root health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Dwelling API is running' });
});

// API Routes
app.use('/api/auth', authRoutes as express.Router);
app.use('/api/users', userRoutes as express.Router);
app.use('/api/properties', propertyRoutes as express.Router);
app.use('/api/favorites', favoriteRoutes as express.Router);
app.use('/api/tours', tourRoutes as express.Router);
app.use('/api/agents', agentRoutes as express.Router);
app.use('/api', statsRoutes as express.Router);

/**
 * POST /api/newsletter
 * Subscribe an email to the newsletter list
 */
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, sourcePage } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, sourcePage: typeof sourcePage === 'string' ? sourcePage : null },
      update: { sourcePage: typeof sourcePage === 'string' ? sourcePage : undefined },
    });
    res.status(200).json({ ok: true, id: subscriber.id });
  } catch (error) {
    console.error('POST /api/newsletter error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Dwelling API is running' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (Hardened to avoid leaking raw database error messages in production)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  if (err?.code === 'P2003') {
    return res.status(401).json({
      error: 'Referenced user account or record no longer exists. Please log in again.'
    });
  }
  const isDev = NODE_ENV === 'development';
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && err?.message ? { message: err.message } : {})
  });
});

// Start server
async function startServer() {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase PostgreSQL via Prisma');

    app.listen(PORT, () => {
      console.log(`🚀 Dwelling API running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Properties:   http://localhost:${PORT}/api/properties`);
      console.log(`   Stats:        http://localhost:${PORT}/api/stats`);
      console.log(`   CORS Origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});