import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Validates and retrieves the JWT secret.
 * Throws an explicit fatal startup error if JWT_SECRET is missing or insecure,
 * preventing silent fallback to hardcoded secrets.
 */
function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION ERROR: The JWT_SECRET environment variable is missing or empty. ' +
      'Dwelling API refuses to start with an insecure configuration. ' +
      'Please configure a strong, unique JWT_SECRET in server/.env before starting the server.'
    );
  }

  const trimmed = secret.trim();

  // Explicitly block known insecure placeholders
  const insecurePlaceholders = [
    'your-secret-key-change-in-production',
    'secret',
    'jwt_secret',
    'change-me',
    'replace_with_a_secure_random_64_character_secret_key',
  ];

  if (insecurePlaceholders.includes(trimmed.toLowerCase())) {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET is set to an insecure default placeholder value. ' +
      'Dwelling API refuses to start using a known default key. ' +
      'Please generate a secure random secret (e.g. node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))") ' +
      'and assign it to JWT_SECRET in server/.env.'
    );
  }

  if (trimmed.length < 32) {
    console.warn(
      '⚠️  SECURITY WARNING: JWT_SECRET is less than 32 characters long. ' +
      'A 256-bit (64 hex characters) secret is strongly recommended for production.'
    );
  }

  return trimmed;
}

/**
 * Returns the list of authorized origins allowed to make cross-origin requests.
 * Reads dynamically from ALLOWED_ORIGINS or CLIENT_URL environment variables.
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;

  if (envOrigins && typeof envOrigins === 'string') {
    const parsed = envOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    if (parsed.length > 0) {
      return parsed;
    }
  }

  // Sensible local development fallbacks
  return [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
  ];
}

export const JWT_SECRET = validateJwtSecret();
export const PORT = process.env.PORT || 5001;
export const NODE_ENV = process.env.NODE_ENV || 'development';
