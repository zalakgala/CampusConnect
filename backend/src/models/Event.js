import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  date: { type: Date, required: true },
  venue: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  category: { type: String, required: true, enum: ['Academic', 'Arts & Culture', 'Career', 'Community', 'Sports', 'Workshop'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  committeeName: { type: String, trim: true, maxlength: 100 }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);

