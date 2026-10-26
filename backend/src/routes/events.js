import { Router } from 'express';
import Event from '../models/Event.js';
import { validateEvent } from '../middleware/validate.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
router.get('/', async (_req, res, next) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ events });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, allowRoles('committee'), async (req, res, next) => {
  const { errors, value } = validateEvent(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the marked fields.', errors });
  try {
    const event = await Event.create({ ...value, createdBy: req.account._id, committeeName: req.account.committeeName });
    return res.status(201).json({ message: 'Event added successfully.', event });
  } catch (error) { return next(error); }
});
export default router;

