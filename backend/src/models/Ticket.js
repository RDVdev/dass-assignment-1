import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['registered', 'purchased', 'cancelled'],
      default: 'registered'
    },
    quantity: { type: Number, default: 1, min: 1 },
    totalAmount: { type: Number, default: 0, min: 0 },
    paymentProofUrl: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    qrCodeToken: { type: String, required: true, unique: true, index: true },
    checkedInAt: { type: Date, default: null }
  },
  { timestamps: true }
);

ticketSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model('Ticket', ticketSchema);
