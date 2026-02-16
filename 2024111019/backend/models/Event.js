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
      enum: ['Draft', 'Published', 'Ongoing', 'Closed'],
      default: 'Draft'
    },
    startDate: Date,
    endDate: Date,
    regDeadline: Date,
    limit: Number,
    formFields: [
      {
        label: String,
        fieldType: { type: String, enum: ['text', 'number', 'file'] },
        required: Boolean
      }
    ],
    price: Number,
    stock: Number,
    variants: [String],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
