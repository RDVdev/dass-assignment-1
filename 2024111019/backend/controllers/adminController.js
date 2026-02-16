const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

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

    const hashedPassword = await bcrypt.hash(password || 'organizer123', 10);

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
      role: organizer.role
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
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

    if (action === 'approve') ticket.status = 'Confirmed';
    if (action === 'reject') ticket.status = 'Rejected';

    await ticket.save();
    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
