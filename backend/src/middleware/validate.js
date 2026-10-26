const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (value) => typeof value === 'string' ? value.trim() : '';

export function validateEvent(body = {}) {
  const errors = {};
  const name = text(body.name);
  const description = text(body.description);
  const venue = text(body.venue);
  const category = text(body.category);
  const date = new Date(body.date);
  if (name.length < 3 || name.length > 100) errors.name = 'Use 3–100 characters.';
  if (description.length < 10 || description.length > 1000) errors.description = 'Use 10–1,000 characters.';
  if (!body.date || Number.isNaN(date.getTime()) || date <= new Date()) errors.date = 'Choose a valid date in the future.';
  if (venue.length < 2 || venue.length > 120) errors.venue = 'Use 2–120 characters.';
  if (!['Academic', 'Arts & Culture', 'Career', 'Community', 'Sports', 'Workshop'].includes(category)) errors.category = 'Choose a listed category.';
  return { errors, value: { name, description, date, venue, category } };
}

export function validateRegistration(body = {}) {
  const errors = {};
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const department = text(body.department);
  const year = Number(body.year);
  if (name.length < 2 || name.length > 80) errors.name = 'Use 2–80 characters.';
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  if (department.length < 2 || department.length > 80) errors.department = 'Use 2–80 characters.';
  if (![1, 2, 3, 4].includes(year)) errors.year = 'Choose a year from 1 to 4.';
  if (!body.eventId || !/^[0-9a-fA-F]{24}$/.test(String(body.eventId))) errors.eventId = 'Choose a valid event.';
  return { errors, value: { name, email, department, year, event: body.eventId } };
}

export function validateContact(body = {}) {
  const errors = {};
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const message = text(body.message);
  if (name.length < 2 || name.length > 80) errors.name = 'Use 2–80 characters.';
  if (!emailPattern.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  if (message.length < 10 || message.length > 2000) errors.message = 'Use 10–2,000 characters.';
  return { errors, value: { name, email, message } };
}

