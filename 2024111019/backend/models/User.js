const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['participant', 'organizer', 'admin'],
      default: 'participant'
    },
    participantType: { type: String, enum: ['IIIT', 'Non-IIIT'] },
    collegeName: { type: String, trim: true },
    interests: [{ type: String }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    onboardingComplete: { type: Boolean, default: false },
    category: String,
    description: String,
    contactNumber: String,
    contactEmail: String,
    website: String,
    discordWebhook: String,
    disabled: { type: Boolean, default: false },
    resetToken: String,
    resetTokenExpiry: Date,
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
