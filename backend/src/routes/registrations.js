import { Router } from 'express';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { validateRegistration } from '../middleware/validate.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();
router.post('/', requireAuth, allowRoles('student'), async (req, res, next) => {
  const { errors, value } = validateRegistration(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the marked fields.', errors });
  if (value.email !== req.account.email) return res.status(403).json({ message: 'Register with the email on your student account.', errors: { email: 'Use the email for your signed-in account.' } });
  try {
    const event = await Event.findById(value.event);
    if (!event) return res.status(400).json({ message: 'That event could not be found.', errors: { eventId: 'Choose an event that still exists.' } });
    const registration = await Registration.create({
      ...value,
      name: req.account.name,
      email: req.account.email,
      department: req.account.department,
      year: req.account.year
    });
    return res.status(201).json({ message: `You're on the list for ${event.name}.`, registration });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'This email is already registered for that event.', errors: { email: 'Already registered for this event.' } });
    return next(error);
  }
});

router.get('/mine', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const registrations = await Registration.find({ email: req.account.email }).populate('event').sort({ createdAt: -1 });
    return res.json({ registrations });
  } catch (error) { return next(error); }
});

router.get('/committee', requireAuth, allowRoles('committee'), async (req, res, next) => {
  try {
    const events = await Event.find({ createdBy: req.account._id }).select('_id name date venue category').sort({ date: 1 });
    const registrations = await Registration.find({ event: { $in: events.map((event) => event._id) } })
      .populate('event', 'name date venue category').sort({ createdAt: -1 });
    return res.json({ events, registrations });
  } catch (error) { return next(error); }
});
export default router;

