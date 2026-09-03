import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export interface AuthUser {
  id: string;
  email: string;
  role: 'SEEKER' | 'AGENT' | 'ADMIN';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const VALID_ROLES: AuthUser['role'][] = ['SEEKER', 'AGENT', 'ADMIN'];

/**
 * Strict authentication middleware.
 * Verifies Bearer JWT tokens on protected routes using the validated environment secret.
 * Rejects missing, malformed, expired, or tampered tokens.
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        error: 'Authentication required. Authorization header is missing.'
      });
    }

    const trimmedHeader = authHeader.trim();
    const parts = trimmedHeader.split(/\s+/);

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({
        error: 'Malformed authorization header. Expected format: "Bearer <token>".'
      });
    }

    const token = parts[1];

    if (!token || token.length < 10) {
      return res.status(401).json({
        error: 'Authentication token is empty or invalid.'
      });
    }

    // Verify token explicitly enforcing HS256 algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as Record<string, any>;

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      !decoded.id ||
      typeof decoded.id !== 'string' ||
      !decoded.role ||
      !VALID_ROLES.includes(decoded.role as any)
    ) {
      return res.status(401).json({
        error: 'Authentication token payload is invalid or corrupted.'
      });
    }

    req.user = {
      id: decoded.id,
      email: typeof decoded.email === 'string' ? decoded.email : '',
      role: decoded.role as AuthUser['role'],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Authentication token has expired. Please log in again.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid authentication token signature.'
      });
    }

    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed. Please verify your credentials.'
    });
  }
};

/**
 * Role authorization guard.
 * Ensures the authenticated user possesses at least one of the required roles.
 */
export const requireRole = (roles: Array<'SEEKER' | 'AGENT' | 'ADMIN'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        error: 'Authentication required to access this resource.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Insufficient permissions. Required role: ${roles.join(' or ')}.`
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware.
 * Attaches user to request if a valid token is present, but permits unauthenticated access.
 */
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.trim().split(/\s+/);
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        const decoded = jwt.verify(parts[1], JWT_SECRET, { algorithms: ['HS256'] }) as Record<string, any>;
        if (decoded && decoded.id && decoded.role && VALID_ROLES.includes(decoded.role as any)) {
          req.user = {
            id: decoded.id,
            email: typeof decoded.email === 'string' ? decoded.email : '',
            role: decoded.role as AuthUser['role'],
          };
        }
      }
    }

    next();
  } catch (_error) {
    // Continue without attaching user on optional auth failures
    next();
  }
};
