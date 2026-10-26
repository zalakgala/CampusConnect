import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  department: { type: String, required: true, trim: true, maxlength: 80 },
  year: { type: Number, required: true, enum: [1, 2, 3, 4] },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }
}, { timestamps: true });

registrationSchema.index({ email: 1, event: 1 }, { unique: true });
export default mongoose.model('Registration', registrationSchema);

