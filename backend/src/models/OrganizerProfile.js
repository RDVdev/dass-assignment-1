import mongoose from 'mongoose';

const organizerProfileSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    clubName: { type: String, required: true, trim: true },
    clubDescription: { type: String, default: '' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('OrganizerProfile', organizerProfileSchema);
