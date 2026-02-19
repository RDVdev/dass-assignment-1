const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const sendTicketEmail = async (userEmail, ticket, event) => {
  if (!process.env.SMTP_USER) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `Ticket Confirmation - ${event.name}`,
      html: `<h2>Ticket Confirmed</h2>
        <p><strong>Event:</strong> ${event.name}</p>
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>Type:</strong> ${ticket.type}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        ${ticket.qrCode ? `<img src="${ticket.qrCode}" alt="QR Code" />` : ''}`
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
};

const postToDiscord = async (organizerId, event) => {
  try {
    const org = await User.findById(organizerId);
    if (!org || !org.discordWebhook) return;
    const fetch = (await import('node-fetch')).default;
    await fetch(org.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**New Event Published:** ${event.name}\n${event.description || ''}\nType: ${event.type}\nDate: ${event.startDate || 'TBD'}`
      })
    });
  } catch (e) {
    console.error('Discord webhook failed:', e.message);
  }
};

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
    const filter = { status: { $ne: 'Draft' } };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.eligibility) filter.eligibility = req.query.eligibility;
    if (req.query.organizer) filter.organizer = req.query.organizer;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.startDate = {};
      if (req.query.dateFrom) filter.startDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.startDate.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
    }

    if (req.query.followedClubs) {
      const clubIds = req.query.followedClubs.split(',');
      filter.organizer = { $in: clubIds };
    }

    let sortObj = { createdAt: -1 };

    if (req.query.trending === 'true') {
      const events = await Event.find({ status: { $ne: 'Draft' } })
        .populate('organizer', 'name email category')
        .sort({ viewCount: -1, registrationCount: -1 })
        .limit(5);
      return res.json(events);
    }

    // Personalized ordering based on user interests
    let events = await Event.find(filter)
      .populate('organizer', 'name email category')
      .sort(sortObj);

    if (req.query.userInterests) {
      const interests = req.query.userInterests.split(',').map((i) => i.toLowerCase());
      events.sort((a, b) => {
        const aScore = (a.tags || []).filter((t) => interests.includes(t.toLowerCase())).length;
        const bScore = (b.tags || []).filter((t) => interests.includes(t.toLowerCase())).length;
        return bScore - aScore;
      });
    }

    return res.json(events);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email role category')
      .populate('comments.user', 'name');
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    event.viewCount = (event.viewCount || 0) + 1;
    await event.save();

    const registrationCount = await Ticket.countDocuments({ event: event._id, status: { $ne: 'Rejected' } });
    return res.json({ ...event.toObject(), registrationCount });
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

    const wasPublishing = event.status === 'Draft' && req.body.status === 'Published';

    // Enforce editing rules based on status
    if (event.status === 'Draft') {
      Object.assign(event, req.body);
    } else if (event.status === 'Published') {
      const allowed = ['description', 'regDeadline', 'limit', 'status'];
      allowed.forEach((k) => { if (req.body[k] !== undefined) event[k] = req.body[k]; });
    } else {
      if (req.body.status) event.status = req.body.status;
    }

    // Lock form after first registration
    if (event.formLocked && req.body.formFields) {
      return res.status(400).json({ msg: 'Form is locked after first registration' });
    }

    await event.save();

    if (wasPublishing) {
      postToDiscord(event.organizer, event);
    }

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

    if (event.status !== 'Published' && event.status !== 'Ongoing') {
      return res.status(400).json({ msg: 'Registration is not open' });
    }
    if (event.regDeadline && new Date() > new Date(event.regDeadline)) {
      return res.status(400).json({ msg: 'Registration deadline has passed' });
    }
    if (event.limit && event.registrationCount >= event.limit) {
      return res.status(400).json({ msg: 'Registration limit reached' });
    }

    const exists = await Ticket.findOne({ event: event._id, user: req.user.id, status: { $ne: 'Cancelled' } });
    if (exists) return res.status(400).json({ msg: 'Already registered' });

    const ticket = await Ticket.create({
      event: event._id,
      user: req.user.id,
      type: 'Registration',
      formData: req.body.formData || {},
      status: 'Confirmed'
    });

    // Generate QR code
    const qrData = JSON.stringify({ ticketId: ticket.ticketId, event: event.name, user: req.user.id });
    ticket.qrCode = await QRCode.toDataURL(qrData);
    await ticket.save();

    // Lock form after first registration
    if (!event.formLocked) {
      event.formLocked = true;
    }
    event.registrationCount = (event.registrationCount || 0) + 1;
    await event.save();

    // Send email
    const user = await User.findById(req.user.id);
    sendTicketEmail(user.email, ticket, event);

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
    if (event.status !== 'Published' && event.status !== 'Ongoing') {
      return res.status(400).json({ msg: 'Purchases not available' });
    }

    const quantity = Number(req.body.quantity || 1);

    // Check purchase limit
    const existingOrders = await Ticket.find({ event: event._id, user: req.user.id, status: { $ne: 'Rejected' } });
    const totalPurchased = existingOrders.reduce((sum, t) => sum + (t.formData?.quantity || 1), 0);
    if (totalPurchased + quantity > (event.purchaseLimitPerUser || 1)) {
      return res.status(400).json({ msg: `Purchase limit is ${event.purchaseLimitPerUser} per user` });
    }

    // Check stock
    if (event.stock !== undefined && event.stock !== null && event.stock < quantity) {
      return res.status(400).json({ msg: 'Out of stock' });
    }

    const ticket = await Ticket.create({
      event: event._id,
      user: req.user.id,
      type: 'Merchandise',
      formData: { variant: req.body.variant, quantity, size: req.body.size, color: req.body.color },
      paymentProofUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      status: 'Pending Approval'
    });

    // NO QR generated while pending — QR only on approval
    // NO stock decrement while pending — stock decremented on approval
    event.registrationCount = (event.registrationCount || 0) + 1;
    await event.save();

    const user = await User.findById(req.user.id);
    sendTicketEmail(user.email, ticket, event);

    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.myTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate({ path: 'event', populate: { path: 'organizer', select: 'name' } })
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate({ path: 'event', populate: { path: 'organizer', select: 'name email' } })
      .populate('user', 'name email');
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const newComment = { user: req.user.id, text: req.body.text, parentComment: req.body.parentComment || null };
    event.comments.push(newComment);
    await event.save();
    const saved = event.comments[event.comments.length - 1];
    return res.json(saved);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

// Toggle reaction on a comment
exports.toggleReaction = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    const comment = event.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    const emoji = req.body.emoji || '👍';
    const existing = comment.reactions.find(r => r.user.toString() === req.user.id && r.emoji === emoji);
    if (existing) {
      comment.reactions = comment.reactions.filter(r => !(r.user.toString() === req.user.id && r.emoji === emoji));
    } else {
      comment.reactions.push({ user: req.user.id, emoji });
    }
    await event.save();
    return res.json({ reactions: comment.reactions });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

// Organizer: get my events
exports.getOrganizerEvents = async (req, res) => {
  try {
    const orgId = req.params.organizerId || req.user.id;
    const events = await Event.find({ organizer: orgId }).sort({ createdAt: -1 });
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Organizer: event analytics (ownership verified)
exports.getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Ownership check
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view stats for this event' });
    }

    const tickets = await Ticket.find({ event: event._id }).populate('user', 'name email').populate('team', 'name');
    const confirmed = tickets.filter((t) => t.status === 'Confirmed');
    const attended = tickets.filter((t) => t.attended);
    const revenue = confirmed.reduce((sum, t) => sum + (event.price || 0) * (t.formData?.quantity || 1), 0);

    return res.json({
      totalRegistrations: tickets.length,
      confirmed: confirmed.length,
      attended: attended.length,
      revenue,
      participants: tickets
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Organizer: export participants CSV (ownership verified)
exports.exportParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Ownership check
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to export participants for this event' });
    }

    const tickets = await Ticket.find({ event: req.params.id })
      .populate('user', 'name email')
      .populate('team', 'name');

    const header = 'Name,Email,Registration Date,Status,Team,Attended\n';
    const rows = tickets.map((t) =>
      `${t.user?.name},${t.user?.email},${t.createdAt.toISOString()},${t.status},${t.team?.name || ''},${t.attended}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=participants-${req.params.id}.csv`);
    return res.send(header + rows);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Organizer: overall analytics for all completed events
exports.getOrganizerAnalytics = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id, status: { $in: ['Completed', 'Closed'] } });
    const eventIds = events.map((e) => e._id);
    const tickets = await Ticket.find({ event: { $in: eventIds } });

    const totalRegistrations = tickets.length;
    const totalRevenue = tickets.filter((t) => t.status === 'Confirmed')
      .reduce((sum, t) => {
        const ev = events.find((e) => e._id.toString() === t.event.toString());
        return sum + (ev?.price || 0) * (t.formData?.quantity || 1);
      }, 0);
    const totalAttended = tickets.filter((t) => t.attended).length;

    return res.json({ totalEvents: events.length, totalRegistrations, totalRevenue, totalAttended });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Mark attendance with timestamp + duplicate check (ownership verified)
exports.markAttendance = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).populate('event', 'organizer');
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    // Ownership check: only the event organizer (or admin) can mark attendance
    if (req.user.role !== 'admin' && ticket.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You can only mark attendance for your own events' });
    }
    if (ticket.attended) return res.status(400).json({ msg: 'Already scanned - duplicate' });
    ticket.attended = true;
    ticket.attendanceTimestamp = new Date();
    await ticket.save();
    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Scan QR and mark attendance by ticketId string (ownership + event scope verified)
exports.scanQR = async (req, res) => {
  try {
    const { ticketId, eventId } = req.body;
    const ticket = await Ticket.findOne({ ticketId }).populate('user', 'name email').populate('event', 'name organizer');
    if (!ticket) return res.status(404).json({ msg: 'Invalid ticket' });
    // Ownership check: only the event organizer (or admin) can scan QR
    if (req.user.role !== 'admin' && ticket.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'This ticket belongs to a different organizer. You can only scan tickets for your own events.' });
    }
    // Event scope check: if eventId is provided, verify the ticket belongs to THIS event
    if (eventId && ticket.event._id.toString() !== eventId) {
      return res.status(403).json({ msg: `This ticket is for "${ticket.event.name}", not for this event. Please scan from the correct event page.` });
    }
    if (ticket.status !== 'Confirmed') return res.status(400).json({ msg: `Ticket status: ${ticket.status}` });
    if (ticket.attended) return res.status(400).json({ msg: 'Already scanned - duplicate entry', ticket });
    ticket.attended = true;
    ticket.attendanceTimestamp = new Date();
    await ticket.save();
    return res.json({ msg: 'Attendance marked', ticket });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Anonymous feedback
exports.submitFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    if (event.status !== 'Completed' && event.status !== 'Closed') {
      return res.status(400).json({ msg: 'Feedback only for completed events' });
    }
    // Check user attended
    const ticket = await Ticket.findOne({ event: event._id, user: req.user.id, status: 'Confirmed' });
    if (!ticket) return res.status(403).json({ msg: 'Only registered participants can give feedback' });

    // Check not already submitted
    const alreadyFed = event.feedback?.some(f => f.user?.toString() === req.user.id);
    if (alreadyFed) return res.status(400).json({ msg: 'Feedback already submitted' });

    event.feedback.push({ user: req.user.id, rating: req.body.rating, comment: req.body.comment });
    await event.save();
    return res.json({ msg: 'Feedback submitted' });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

// Get feedback for an event (supports ?rating=N filter)
exports.getFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('feedback name');
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    let fb = event.feedback || [];
    
    // Filter by rating if provided
    if (req.query.rating) {
      const rating = Number(req.query.rating);
      if (rating >= 1 && rating <= 5) {
        fb = fb.filter(f => f.rating === rating);
      }
    }
    
    const allFb = event.feedback || [];
    const avg = allFb.length ? (allFb.reduce((s, f) => s + f.rating, 0) / allFb.length).toFixed(1) : 0;
    return res.json({ feedback: fb, averageRating: Number(avg), total: allFb.length, filtered: fb.length });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Delete comment (organizer moderation, ownership verified)
exports.deleteComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    // Ownership check
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to moderate comments for this event' });
    }
    event.comments = event.comments.filter(c => c._id.toString() !== req.params.commentId);
    await event.save();
    return res.json({ msg: 'Comment deleted' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Pin comment (ownership verified)
exports.pinComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    // Ownership check
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to pin comments for this event' });
    }
    const cid = req.params.commentId;
    if (event.pinnedComments?.includes(cid)) {
      event.pinnedComments = event.pinnedComments.filter(id => id.toString() !== cid);
    } else {
      event.pinnedComments = [...(event.pinnedComments || []), cid];
    }
    await event.save();
    return res.json({ msg: 'Pin toggled' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Generate .ics calendar file for an event
exports.getCalendar = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const formatDate = (d) => {
      if (!d) return null;
      return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const start = formatDate(event.startDate) || formatDate(new Date());
    const end = formatDate(event.endDate) || formatDate(new Date(new Date(event.startDate || Date.now()).getTime() + 2 * 60 * 60 * 1000));
    const uid = `${event._id}@felicity`;
    const description = (event.description || '').replace(/\n/g, '\\n');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Felicity IIITH//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${description}`,
      `ORGANIZER;CN=${event.organizer?.name || 'Organizer'}:mailto:${event.organizer?.email || ''}`,
      'LOCATION:IIIT Hyderabad',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${event.name.replace(/\s+/g, '_')}.ics`);
    return res.send(ics);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
