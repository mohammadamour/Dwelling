import * as dotenv from 'dotenv';
dotenv.config();
import express = require('express');
import cors = require('cors');
import { PrismaClient } from '@prisma/client';
import propertyRoutes = require('./routes/propertyRoutes');
import statsRoutes = require('./routes/stats');
import authRoutes = require('./routes/auth');
import userRoutes = require('./routes/userRoutes');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
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

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err?.message });
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