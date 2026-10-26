import { createHmac, timingSafeEqual } from 'node:crypto';
import Account from '../models/Account.js';

function sign(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set to at least 32 characters.');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const content = `${header}.${body}`;
  return `${content}.${createHmac('sha256', secret).update(content).digest('base64url')}`;
}

export function createToken(account) {
  return sign({ sub: account.id, role: account.role, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
}

function verify(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const content = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', process.env.JWT_SECRET).update(content).digest();
  let actual;
  try { actual = Buffer.from(parts[2], 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.sub || !['student', 'committee'].includes(payload.role) || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const payload = header.startsWith('Bearer ') ? verify(header.slice(7)) : null;
  if (!payload) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const account = await Account.findById(payload.sub).select('-passwordHash');
    if (!account || account.role !== payload.role) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    req.account = account;
    return next();
  } catch (error) { return next(error); }
}

export function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.account?.role)
    ? next()
    : res.status(403).json({ message: 'This area is only available to the appropriate account type.' });
}

export function publicAccount(account) {
  return { id: account.id, name: account.name, email: account.email, role: account.role, department: account.department, year: account.year, committeeName: account.committeeName };
}

