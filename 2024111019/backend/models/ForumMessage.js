const mongoose = require('mongoose');

const forumMessageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  userName: {
    type: String,
    default: 'Anonymous'
  },
  userRole: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    default: 'participant'
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage',
    default: null
  },
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: { type: String, default: '👍' }
    }
  ],
  pinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

forumMessageSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('ForumMessage', forumMessageSchema);
