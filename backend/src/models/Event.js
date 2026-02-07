import mongoose from 'mongoose';
import { EVENT_STATUS, EVENT_TYPES } from '../utils/constants.js';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(EVENT_TYPES),
      default: EVENT_TYPES.NORMAL,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
      index: true
    },
    venue: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    price: { type: Number, default: 0, min: 0 },
    tags: [{ type: String }],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    registrationCount: { type: Number, default: 0 },
    checkedInCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
