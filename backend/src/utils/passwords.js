import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, savedHash) {
  const [salt, savedKeyHex] = savedHash.split(':');
  if (!salt || !savedKeyHex) return false;
  const savedKey = Buffer.from(savedKeyHex, 'hex');
  const candidate = await scrypt(password, salt, savedKey.length);
  return candidate.length === savedKey.length && timingSafeEqual(candidate, savedKey);
}

