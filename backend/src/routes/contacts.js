import { Router } from 'express';
import Contact from '../models/Contact.js';
import { validateContact } from '../middleware/validate.js';

const router = Router();
router.post('/', async (req, res, next) => {
  const { errors, value } = validateContact(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the marked fields.', errors });
  try {
    await Contact.create(value);
    return res.status(201).json({ message: 'Thanks for reaching out. Your message has been sent.' });
  } catch (error) { return next(error); }
});
export default router;

