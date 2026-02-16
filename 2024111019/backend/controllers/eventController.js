const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user.id });
    return res.status(201).json(event);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const events = await Event.find(filter).populate('organizer', 'name email role');
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email role');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not allowed to update this event' });
    }

    Object.assign(event, req.body);
    await event.save();
    return res.json(event);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not allowed to delete this event' });
    }

    await event.deleteOne();
    return res.json({ msg: 'Event deleted' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const exists = await Ticket.findOne({ event: event._id, user: req.user.id });
    if (exists) return res.status(400).json({ msg: 'Already registered' });

    const ticket = await Ticket.create({
      event: event._id,
      user: req.user.id,
      type: event.type === 'Merchandise' ? 'Merchandise' : 'Registration',
      formData: req.body.formData || {},
      status: event.type === 'Merchandise' ? 'Pending Approval' : 'Confirmed'
    });

    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.orderMerchandise = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.type !== 'Merchandise') {
      return res.status(400).json({ msg: 'Invalid merchandise event' });
    }

    const ticket = await Ticket.create({
      event: event._id,
      user: req.user.id,
      type: 'Merchandise',
      formData: {
        variant: req.body.variant,
        quantity: Number(req.body.quantity || 1)
      },
      paymentProofUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      status: 'Pending Approval'
    });

    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.myTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate('event', 'name type status startDate endDate')
      .sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    event.comments.push({ user: req.user.id, text: req.body.text });
    await event.save();
    return res.json(event.comments[event.comments.length - 1]);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};
