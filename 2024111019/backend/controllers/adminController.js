const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const { transporter, isMailConfigured, getMailFrom } = require('../config/mailer');

const sendMerchApprovalEmail = async (userEmail, ticket, event) => {
  if (!isMailConfigured()) return;
  try {
    // Build inline attachment for QR code (email clients block base64 data URIs)
    const attachments = [];
    let qrHtml = '';
    if (ticket.qrCode && ticket.qrCode.startsWith('data:image/png;base64,')) {
      const base64Data = ticket.qrCode.replace(/^data:image\/png;base64,/, '');
      attachments.push({
        filename: 'qrcode.png',
        content: Buffer.from(base64Data, 'base64'),
        cid: 'qrcode@felicity'
      });
      qrHtml = '<div style="text-align:center;margin:20px 0"><p style="color:#666">Your QR Code (show this for collection):</p><img src="cid:qrcode@felicity" alt="QR Code" style="width:200px;height:200px" /></div>';
    }

    await transporter.sendMail({
      from: getMailFrom(),
      to: userEmail,
      subject: `✅ Order Confirmed - ${event.name}`,
      attachments,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
          <div style="background:#10b981;color:white;padding:20px;text-align:center">
            <h1 style="margin:0">Order Confirmed!</h1>
          </div>
          <div style="padding:24px">
            <h2 style="color:#333">${event.name}</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Ticket ID</td><td style="padding:8px;border-bottom:1px solid #eee">${ticket.ticketId}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Type</td><td style="padding:8px;border-bottom:1px solid #eee">Merchandise</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Variant</td><td style="padding:8px;border-bottom:1px solid #eee">${ticket.formData?.variant || 'N/A'} (${ticket.formData?.size || ''} / ${ticket.formData?.color || ''})</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Quantity</td><td style="padding:8px;border-bottom:1px solid #eee">${ticket.formData?.quantity || 1}</td></tr>
              <tr><td style="padding:8px;font-weight:bold">Status</td><td style="padding:8px;color:#10b981;font-weight:bold">✅ Confirmed</td></tr>
            </table>
            ${qrHtml}
            <p style="color:#666;font-size:14px">Your payment has been verified and your order is confirmed. Show the QR code above when collecting your merchandise.</p>
          </div>
          <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#999">Felicity IIIT-H Event Management</div>
        </div>`
    });
    console.log(`✓ Merch approval email sent to ${userEmail}`);
  } catch (e) {
    console.error('Merch approval email failed:', {
      message: e.message,
      code: e.code,
      responseCode: e.responseCode,
      response: e.response
    });
  }
};

const sendMerchRejectionEmail = async (userEmail, ticket, event) => {
  if (!isMailConfigured()) return;
  try {
    await transporter.sendMail({
      from: getMailFrom(),
      to: userEmail,
      subject: `❌ Order Rejected - ${event.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
          <div style="background:#ef4444;color:white;padding:20px;text-align:center">
            <h1 style="margin:0">Order Rejected</h1>
          </div>
          <div style="padding:24px">
            <h2 style="color:#333">${event.name}</h2>
            <p>Your merchandise order <strong>${ticket.ticketId}</strong> for <strong>${ticket.formData?.variant || 'item'}</strong> has been rejected.</p>
            <p style="color:#666">This may be due to an invalid payment proof. Please contact the organizer for more details or place a new order with valid payment proof.</p>
          </div>
          <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#999">Felicity IIIT-H Event Management</div>
        </div>`
    });
    console.log(`✓ Merch rejection email sent to ${userEmail}`);
  } catch (e) {
    console.error('Merch rejection email failed:', {
      message: e.message,
      code: e.code,
      responseCode: e.responseCode,
      response: e.response
    });
  }
};

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

    // Cascade delete: remove all associated data
    const events = await Event.find({ organizer: organizer._id });
    const eventIds = events.map(e => e._id);

    // Delete all tickets for these events
    await Ticket.deleteMany({ event: { $in: eventIds } });

    // Delete all events
    await Event.deleteMany({ organizer: organizer._id });

    // Finally delete the organizer user
    await organizer.deleteOne();
    return res.json({ msg: 'Organizer and all associated data permanently deleted' });
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

    // Send email notifications
    const user = await User.findById(ticket.user);
    if (user) {
      const eventDoc = ticket.event;
      if (action === 'approve') {
        sendMerchApprovalEmail(user.email, ticket, eventDoc);
      } else if (action === 'reject') {
        sendMerchRejectionEmail(user.email, ticket, eventDoc);
      }
    }

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
