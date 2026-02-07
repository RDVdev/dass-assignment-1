import Event from '../models/Event.js';
import Ticket from '../models/Ticket.js';
import { EVENT_STATUS } from '../utils/constants.js';

export const listEvents = async (req, res) => {
  const { q = '', type, status = EVENT_STATUS.PUBLISHED } = req.query;
  const filter = {
    title: { $regex: q, $options: 'i' }
  };

  if (type) filter.type = type;
  if (status) filter.status = status;

  const events = await Event.find(filter)
    .populate('organizer', 'name email')
    .sort({ startDate: 1 });

  res.json({ events });
};

export const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name email');
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ event });
};

export const listMyEvents = async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
  res.json({ events });
};

export const createEvent = async (req, res) => {
  const event = await Event.create({ ...req.body, organizer: req.user._id });
  res.status(201).json({ event });
};

export const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (String(event.organizer) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only edit your own events' });
  }

  Object.assign(event, req.body);
  await event.save();
  res.json({ event });
};

export const publishEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (String(event.organizer) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only publish your own events' });
  }

  event.status = EVENT_STATUS.PUBLISHED;
  await event.save();
  res.json({ event });
};

export const organizerAnalytics = async (req, res) => {
  const events = await Event.find({ organizer: req.user._id });
  const eventIds = events.map((e) => e._id);

  const tickets = await Ticket.find({ event: { $in: eventIds } });
  const totalRevenue = tickets.reduce((sum, t) => sum + t.totalAmount, 0);

  const byEvent = events.map((event) => {
    const eventTickets = tickets.filter((t) => String(t.event) === String(event._id));
    return {
      eventId: event._id,
      title: event.title,
      registrations: eventTickets.length,
      checkedIn: eventTickets.filter((t) => Boolean(t.checkedInAt)).length,
      revenue: eventTickets.reduce((sum, t) => sum + t.totalAmount, 0)
    };
  });

  res.json({
    totalEvents: events.length,
    totalRegistrations: tickets.length,
    totalRevenue,
    byEvent
  });
};
