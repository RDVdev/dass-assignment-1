const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, default: 4 },
    inviteCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Forming', 'Complete', 'Registered'], default: 'Forming' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
