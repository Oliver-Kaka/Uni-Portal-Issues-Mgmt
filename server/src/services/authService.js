/**
 * Admin authentication service.
 * - hashPassword()  : one-time bcrypt hash for setup
 * - verifyPassword(): bcrypt compare on login
 * - signToken()     : issues a short-lived JWT
 * - verifyToken()   : validates a JWT from the httpOnly cookie
 *
 * The password hash is stored in .env (ADMIN_PASSWORD_HASH).
 * The plaintext password NEVER appears in code or logs.
 *
 * Demo Only: Fictional admin accounts only.
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const BCRYPT_ROUNDS = 10;

/** One-time utility — run with: node -e "import('./src/services/authService.js').then(m=>m.hashPassword('yourpassword').then(console.log))" */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Compares a plaintext password against the stored bcrypt hash. */
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/** Signs a JWT containing { username, role }. Expiry from JWT_EXPIRES_IN env var. */
export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set.');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

/** Verifies a JWT. Returns the decoded payload or throws. */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set.');
  return jwt.verify(token, secret);
}
