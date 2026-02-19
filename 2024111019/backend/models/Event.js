const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['Normal', 'Merchandise', 'Hackathon'],
      required: true
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
      default: 'Draft'
    },
    eligibility: { type: String, enum: ['All', 'IIIT', 'Non-IIIT'], default: 'All' },
    startDate: Date,
    endDate: Date,
    regDeadline: Date,
    limit: Number,
    registrationCount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    tags: [{ type: String }],
    formFields: [
      {
        label: String,
        fieldType: { type: String, enum: ['text', 'number', 'dropdown', 'checkbox', 'file'] },
        required: Boolean,
        options: [String]
      }
    ],
    formLocked: { type: Boolean, default: false },
    stock: Number,
    variants: [
      {
        name: String,
        size: String,
        color: String,
        stock: { type: Number, default: 0 }
      }
    ],
    purchaseLimitPerUser: { type: Number, default: 1 },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        parentComment: { type: mongoose.Schema.Types.ObjectId, default: null },
        reactions: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            emoji: { type: String, default: '👍' }
          }
        ],
        timestamp: { type: Date, default: Date.now }
      }
    ],
    viewCount: { type: Number, default: 0 },
    minTeamSize: { type: Number, default: 2 },
    maxTeamSize: { type: Number, default: 4 },
    feedback: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    pinnedComments: [{ type: mongoose.Schema.Types.ObjectId }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
