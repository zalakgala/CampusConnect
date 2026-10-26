import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';
import contactRoutes from './routes/contacts.js';
import authRoutes from './routes/auth.js';

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()) || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/contacts', contactRoutes);
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') {
    const errors = Object.fromEntries(Object.entries(error.errors).map(([field, issue]) => [field, issue.message]));
    return res.status(400).json({ message: 'Please correct the marked fields.', errors });
  }
  if (error.name === 'CastError') return res.status(400).json({ message: 'The submitted ID is invalid.' });
  return res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
});

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI. Copy backend/.env.example to backend/.env and configure MongoDB.');
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Missing or short JWT_SECRET. Set a random secret of at least 32 characters in backend/.env.');
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');
  app.listen(port, () => console.log(`CampusConnect API listening on port ${port}`));
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exit(1);
}

