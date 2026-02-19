const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, default: () => `TKT-${uuidv4().slice(0, 8).toUpperCase()}` },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Registration', 'Merchandise'], required: true },
    formData: { type: Object },
    paymentProofUrl: String,
    qrCode: String,
    status: {
      type: String,
      enum: ['Confirmed', 'Pending Approval', 'Rejected', 'Cancelled'],
      default: 'Confirmed'
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    attended: { type: Boolean, default: false },
    attendanceTimestamp: Date
  },
  { timestamps: true }
);

ticketSchema.index({ event: 1, user: 1 }, { unique: true, partialFilterExpression: { team: { $exists: false } } });

module.exports = mongoose.model('Ticket', ticketSchema);
