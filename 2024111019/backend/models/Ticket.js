const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Registration', 'Merchandise'], required: true },
    formData: { type: Object },
    paymentProofUrl: String,
    status: {
      type: String,
      enum: ['Confirmed', 'Pending Approval', 'Rejected'],
      default: 'Confirmed'
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
  },
  { timestamps: true }
);

ticketSchema.index({ event: 1, user: 1 }, { unique: true, partialFilterExpression: { team: { $exists: false } } });

module.exports = mongoose.model('Ticket', ticketSchema);
