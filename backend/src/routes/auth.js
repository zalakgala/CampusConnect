import { Router } from 'express';
import Account from '../models/Account.js';
import { requireAuth, createToken, publicAccount } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value) => typeof value === 'string' ? value.trim() : '';

router.post('/student/register', async (req, res, next) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const department = clean(req.body.department);
  const year = Number(req.body.year);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const errors = {};
  if (name.length < 2 || name.length > 80) errors.name = 'Use 2–80 characters.';
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  if (department.length < 2 || department.length > 80) errors.department = 'Use 2–80 characters.';
  if (![1, 2, 3, 4].includes(year)) errors.year = 'Choose a year from 1 to 4.';
  if (password.length < 8 || password.length > 128) errors.password = 'Use a password with 8–128 characters.';
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the marked fields.', errors });
  try {
    const account = await Account.create({ name, email, passwordHash: await hashPassword(password), role: 'student', department, year });
    return res.status(201).json({ token: createToken(account), user: publicAccount(account), message: 'Your student account is ready.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account already uses this email.', errors: { email: 'This email already has an account. Try signing in.' } });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const email = clean(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = req.body.role;
  const errors = {};
  if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';
  if (!password || password.length > 128) errors.password = 'Enter your password.';
  if (!['student', 'committee'].includes(role)) errors.role = 'Choose a login type.';
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the marked fields.', errors });
  try {
    const account = await Account.findOne({ email, role });
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      return res.status(401).json({ message: 'Email or password didn’t match this login.' });
    }
    return res.json({ token: createToken(account), user: publicAccount(account), message: 'You’re signed in.' });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicAccount(req.account) }));

export default router;

