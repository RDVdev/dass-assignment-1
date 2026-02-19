const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const QRCode = require('qrcode');

exports.getOrganizers = async (_req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' }).select('-password');
    return res.json(organizers);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.createOrganizer = async (req, res) => {
  try {
    const { name, email, password, category, description, contactNumber, website } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already exists' });

    const generatedPassword = password || `Org${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const organizer = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'organizer',
      category,
      description,
      contactNumber,
      website
    });

    return res.status(201).json({
      id: organizer._id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
      generatedPassword
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.disableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ msg: 'Organizer not found' });
    }

    organizer.disabled = !organizer.disabled;
    await organizer.save();
    return res.json({ msg: organizer.disabled ? 'Organizer disabled' : 'Organizer enabled', organizer });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ msg: 'Organizer not found' });
    }

    await organizer.deleteOne();
    return res.json({ msg: 'Organizer permanently deleted' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getResetRequests = async (_req, res) => {
  try {
    const requests = await User.find({
      role: 'organizer',
      'resetRequest.status': 'Pending'
    }).select('name email resetRequest');

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.updateResetRequest = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { action } = req.body;

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ msg: 'Organizer not found' });
    }

    if (action === 'approve') {
      const newPassword = `Org${Math.random().toString(36).slice(-8)}!`;
      organizer.password = await bcrypt.hash(newPassword, 10);
      organizer.resetRequest.status = 'Approved';
      await organizer.save();
      return res.json({ msg: 'Reset approved', temporaryPassword: newPassword });
    }

    organizer.resetRequest.status = 'Rejected';
    await organizer.save();
    return res.json({ msg: 'Reset rejected' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.reviewMerchOrder = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { action } = req.body;

    const ticket = await Ticket.findById(ticketId).populate('event');
    if (!ticket) return res.status(404).json({ msg: 'Order not found' });

    // Ownership check: organizer can only approve their own events' orders
    if (req.user.role !== 'admin' && ticket.event?.organizer?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to manage orders for this event' });
    }

    if (action === 'approve') {
      ticket.status = 'Confirmed';
      // Generate QR only on approval
      const qrData = JSON.stringify({ ticketId: ticket.ticketId, event: ticket.event?.name, type: 'Merchandise' });
      ticket.qrCode = await QRCode.toDataURL(qrData);

      // Decrement stock on approval
      if (ticket.event) {
        const event = await Event.findById(ticket.event._id);
        const qty = ticket.formData?.quantity || 1;
        if (event.stock !== undefined && event.stock !== null) {
          event.stock -= qty;
        }
        event.registrationCount = (event.registrationCount || 0) + 1;
        await event.save();
      }
    }
    if (action === 'reject') {
      ticket.status = 'Rejected';
      ticket.qrCode = undefined;
    }

    await ticket.save();
    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Get all merch orders for organizer's events
exports.getMerchOrders = async (req, res) => {
  try {
    const organizerId = req.params.organizerId || req.user.id;
    const events = await Event.find({ organizer: organizerId, type: 'Merchandise' });
    const eventIds = events.map(e => e._id);
    const tickets = await Ticket.find({ event: { $in: eventIds }, type: 'Merchandise' })
      .populate('user', 'name email')
      .populate('event', 'name')
      .sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
