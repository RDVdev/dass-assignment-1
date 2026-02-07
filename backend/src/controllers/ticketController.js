import crypto from 'crypto';
import Event from '../models/Event.js';
import Ticket from '../models/Ticket.js';

export const registerForEvent = async (req, res) => {
  const { eventId, quantity = 1 } = req.body;

  const event = await Event.findById(eventId);
  if (!event || event.status !== 'published') {
    return res.status(404).json({ message: 'Event unavailable' });
  }

  if (new Date(event.deadline) < new Date()) {
    return res.status(400).json({ message: 'Registration deadline passed' });
  }

  const exists = await Ticket.findOne({ user: req.user._id, event: event._id });
  if (exists) {
    return res.status(409).json({ message: 'Already registered for this event' });
  }

  if (event.capacity > 0 && event.registrationCount + quantity > event.capacity) {
    return res.status(400).json({ message: 'Event capacity exceeded' });
  }

  const amount = event.price * quantity;
  const qrCodeToken = crypto.randomBytes(16).toString('hex');

  const ticket = await Ticket.create({
    user: req.user._id,
    event: event._id,
    quantity,
    totalAmount: amount,
    status: amount > 0 ? 'purchased' : 'registered',
    paymentStatus: amount > 0 ? 'pending' : 'none',
    qrCodeToken
  });

  event.registrationCount += quantity;
  await event.save();

  res.status(201).json({ ticket });
};

export const myTickets = async (req, res) => {
  const { tab = 'upcoming' } = req.query;
  const tickets = await Ticket.find({ user: req.user._id })
    .populate('event')
    .sort({ createdAt: -1 });

  const now = new Date();
  const filtered = tickets.filter((ticket) => {
    if (!ticket.event) return false;
    const ended = new Date(ticket.event.endDate) < now;
    return tab === 'history' ? ended : !ended;
  });

  res.json({ tickets: filtered });
};

export const uploadPaymentProof = async (req, res) => {
  const { ticketId, paymentProofUrl } = req.body;

  const ticket = await Ticket.findOne({ _id: ticketId, user: req.user._id }).populate('event');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  ticket.paymentProofUrl = paymentProofUrl;
  ticket.paymentStatus = 'pending';
  await ticket.save();

  res.json({ ticket, message: 'Payment proof submitted' });
};

export const reviewPaymentProof = async (req, res) => {
  const { ticketId, decision } = req.body;

  const ticket = await Ticket.findById(ticketId).populate('event');
  if (!ticket || !ticket.event) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  if (String(ticket.event.organizer) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only event organizer can verify payment' });
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be approved/rejected' });
  }

  ticket.paymentStatus = decision;
  await ticket.save();

  res.json({ ticket, message: `Payment ${decision}` });
};

export const checkInByQR = async (req, res) => {
  const { qrCodeToken } = req.body;

  const ticket = await Ticket.findOne({ qrCodeToken }).populate('event user');
  if (!ticket || !ticket.event) {
    return res.status(404).json({ message: 'Invalid ticket QR' });
  }

  if (String(ticket.event.organizer) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Only organizer can check-in this ticket' });
  }

  if (ticket.checkedInAt) {
    return res.status(400).json({ message: 'Already checked in', ticket });
  }

  ticket.checkedInAt = new Date();
  await ticket.save();

  ticket.event.checkedInCount += ticket.quantity;
  await ticket.event.save();

  res.json({ message: 'Check-in successful', ticket });
};
