import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './lib/prisma';
import { getAllowedOrigins, PORT, NODE_ENV } from './config/env';
import propertyRoutes from './routes/propertyRoutes';
import statsRoutes from './routes/stats';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import tourRoutes from './routes/tourRoutes';
import agentRoutes from './routes/agentRoutes';
import { generalApiLimiter, newsletterLimiter } from './middleware/rateLimiter';

const app = express();

// Trust reverse proxy hops (required for Render.com and express-rate-limit client IP resolution)
app.set('trust proxy', 1);

// Security Headers: Comprehensive HTTP header hardening via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: false,
}));

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

    // Automatically allow deployed Render domains (prevents CORS lockout from misconfigured env vars)
    if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin)) {
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

// API Rate Limiting: General blanket protection for all /api endpoints
app.use('/api', generalApiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api', statsRoutes);

/**
 * POST /api/newsletter
 * Subscribe an email to the newsletter list (throttled by newsletterLimiter)
 */
app.post('/api/newsletter', newsletterLimiter, async (req, res) => {
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

// Health check (used by Render)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Dwelling API is running' });
});

// Frontend Static & Page Route Handling
const candidatePaths = [
  path.resolve(__dirname, '../FrontEnd'),
  path.resolve(__dirname, '../../FrontEnd'),
  path.resolve(__dirname, '../../../FrontEnd'),
  path.resolve(process.cwd(), 'dist/FrontEnd'),
  path.resolve(process.cwd(), '../FrontEnd'),
  path.resolve(process.cwd(), 'FrontEnd'),
];
const frontEndPath = candidatePaths.find((p) => fs.existsSync(p));

if (frontEndPath) {
  // Serve static assets (CSS, JS, images)
  app.use(express.static(frontEndPath));

  // Root route: serve index.html
  app.get('/', (_req, res) => {
    res.sendFile(path.join(frontEndPath, 'index.html'));
  });

  // Top-level clean page URLs (e.g. /login -> /pages/login.html)
  const topLevelPages = ['login', 'register', 'properties', 'property-details', 'profile', 'add-property'];
  topLevelPages.forEach((page) => {
    app.get(`/${page}`, (_req, res) => {
      const pageFile = path.join(frontEndPath, 'pages', `${page}.html`);
      if (fs.existsSync(pageFile)) {
        return res.sendFile(pageFile);
      }
      res.redirect('/');
    });
  });

  // Pages subdirectory clean URLs (e.g. /pages/login -> /pages/login.html)
  app.get('/pages/:page', (req, res, next) => {
    const pageName = req.params.page.replace(/\.html$/, '');
    const pageFile = path.join(frontEndPath, 'pages', `${pageName}.html`);
    if (fs.existsSync(pageFile)) {
      return res.sendFile(pageFile);
    }
    next();
  });

  // Fallback for non-API routes: serve index.html
  app.get('(.*)', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontEndPath, 'index.html'));
  });
} else {
  // Standalone API root fallback if FrontEnd directory is absent
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'Dwelling API is running' });
  });
}

// 404 handler for API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// General 404 fallback
app.use((_req, res) => {
  if (frontEndPath) {
    return res.sendFile(path.join(frontEndPath, 'index.html'));
  }
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