import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest, authenticate } from '../middleware/auth';
import { JWT_SECRET } from '../config/env';
import { getUserProfile } from '../controllers/userController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Robust email validation regex (RFC 5322 compliant subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * POST /api/auth/register
 * Register a new user account with role sanitization and security checks.
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role, isAdmin } = req.body || {};

    // 1. Core input validations
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 255) {
      return res.status(400).json({ error: 'Please provide a valid email format.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password.length > 100) {
      return res.status(400).json({ error: 'Password exceeds maximum length limit.' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
    }

    // 2. Privilege escalation prevention
    // Explicitly reject any client attempt to self-assign administrative roles
    if (
      (typeof role === 'string' && role.trim().toUpperCase() === 'ADMIN') ||
      isAdmin === true ||
      isAdmin === 'true'
    ) {
      return res.status(403).json({
        error: 'Administrative privileges cannot be assigned via registration. Standard accounts only.'
      });
    }

    // Strictly sanitize role: default strictly to SEEKER; allow AGENT only if explicitly requested
    let assignedRole: Role = Role.SEEKER;
    if (typeof role === 'string' && role.trim().toUpperCase() === 'AGENT') {
      assignedRole = Role.AGENT;
    }

    const sanitizedPhone = typeof phone === 'string' && phone.trim().length > 0 ? phone.trim().substring(0, 30) : null;

    // 3. Uniqueness check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // 4. Secure password hashing
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create user record
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: trimmedName,
        phone: sanitizedPhone,
        role: assignedRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      }
    });

    // 6. Sign JWT token enforcing HS256 algorithm and explicit expiration
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.status(201).json({
      data: {
        user,
        token
      },
      user,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed due to an internal server error.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with email and password.
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by normalized email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // Use generic error message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password against stored bcrypt hash
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token with verified secret and explicit algorithm
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.status(200).json({
      data: {
        user: userResponse,
        token
      },
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed due to an internal server error.' });
  }
});

/**
 * GET /api/auth/me
 * Session verification endpoint (unified with /api/users/me using standardized envelope pattern)
 */
router.get('/me', authenticate, getUserProfile);

export default router;
