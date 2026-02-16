const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['participant', 'organizer', 'admin'],
      default: 'participant'
    },
    participantType: { type: String, enum: ['IIIT', 'Non-IIIT'] },
    interests: [{ type: String }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    category: String,
    description: String,
    contactNumber: String,
    website: String,
    resetRequest: {
      status: {
        type: String,
        enum: ['None', 'Pending', 'Approved', 'Rejected'],
        default: 'None'
      },
      reason: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
