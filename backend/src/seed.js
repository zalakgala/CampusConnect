import 'dotenv/config';
import mongoose from 'mongoose';
import Event from './models/Event.js';
import Account from './models/Account.js';
import { hashPassword } from './utils/passwords.js';

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy backend/.env.example to backend/.env first.');
  process.exit(1);
}

const today = new Date();
const inDays = (days, hour = 15) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};
const samples = [
  { name: 'The little big ideas fair', description: 'Bring a half-formed idea, meet a curious collaborator, and leave with the first sketch of something worth making.', date: inDays(8), venue: 'Old Library Courtyard', category: 'Community' },
  { name: 'Print, paper & everything', description: 'A hands-on afternoon exploring zines, block printing, and the joy of making things slowly with your hands.', date: inDays(14), venue: 'Studio 2, Arts Block', category: 'Arts & Culture' },
  { name: 'Making a good first impression', description: 'A friendly career workshop on portfolios, interview nerves, and telling your story without sounding like a brochure.', date: inDays(21), venue: 'Seminar Hall B', category: 'Career' }
];

try {
  await mongoose.connect(process.env.MONGODB_URI);
  let inserted = 0;
  for (const sample of samples) {
    const existing = await Event.exists({ name: sample.name });
    if (!existing) { await Event.create(sample); inserted += 1; }
  }
  console.log(`Seed complete. Added ${inserted} sample event(s); existing samples were left in place.`);
  if (process.env.SEED_COMMITTEE_EMAIL && process.env.SEED_COMMITTEE_PASSWORD) {
    const email = process.env.SEED_COMMITTEE_EMAIL.trim().toLowerCase();
    const password = process.env.SEED_COMMITTEE_PASSWORD;
    if (password.length < 8) throw new Error('SEED_COMMITTEE_PASSWORD must have at least 8 characters.');
    const name = process.env.SEED_COMMITTEE_NAME || 'Campus Events Committee';
    const passwordHash = await hashPassword(password);
    await Account.findOneAndUpdate({ email, role: 'committee' }, { name, committeeName: name, email, passwordHash, role: 'committee' }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`Provisioned committee account for ${email}.`);
  }
} catch (error) {
  console.error('Could not seed events:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

