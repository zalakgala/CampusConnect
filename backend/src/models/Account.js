import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'committee'] },
  department: { type: String, trim: true, maxlength: 80 },
  year: { type: Number, enum: [1, 2, 3, 4] },
  committeeName: { type: String, trim: true, maxlength: 100 }
}, { timestamps: true });

export default mongoose.model('Account', accountSchema);

