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

// Auto-determine event status based on current time vs start/end dates
const computeEventStatus = (event) => {
  if (event.status === 'Draft' || event.status === 'Closed') return event.status;
  const now = new Date();
  if (event.endDate && now > new Date(event.endDate)) return 'Completed';
  if (event.startDate && now >= new Date(event.startDate)) return 'Ongoing';
  if (event.status === 'Published' || event.status === 'Ongoing' || event.status === 'Completed') return event.status;
  return event.status;
};

// Apply auto-status to event and persist if changed
const applyAutoStatus = async (event) => {
  const computed = computeEventStatus(event);
  if (computed !== event.status) {
    event.status = computed;
    await event.save();
  }
  return event;
};

const sendTicketEmail = async (userEmail, ticket, event) => {
  if (!process.env.SMTP_USER) return;
  try {
    const isRegistration = ticket.type === 'Registration';
    const statusColor = ticket.status === 'Confirmed' ? '#10b981' : (ticket.status === 'Pending Approval' ? '#f59e0b' : '#3b82f6');
    const headerBg = isRegistration ? '#3b82f6' : '#f59e0b';
    const headerText = isRegistration ? 'Registration Confirmed!' : 'Merchandise Order Placed';

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD';

    await transporter.sendMail({
      from: `"Felicity IIIT-H" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `${isRegistration ? '🎫' : '🛍️'} ${headerText} - ${event.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
          <div style="background:${headerBg};color:white;padding:20px;text-align:center">
            <h1 style="margin:0">${headerText}</h1>
          </div>
          <div style="padding:24px">
            <h2 style="color:#333;margin-top:0">${event.name}</h2>
            ${event.description ? `<p style="color:#666">${event.description.substring(0, 150)}...</p>` : ''}
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Ticket ID</td><td style="padding:8px;border-bottom:1px solid #eee">${ticket.ticketId}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Type</td><td style="padding:8px;border-bottom:1px solid #eee">${ticket.type}</td></tr>
              ${isRegistration && event.startDate ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Event Date</td><td style="padding:8px;border-bottom:1px solid #eee">${fmtDate(event.startDate)}</td></tr>` : ''}
              ${!isRegistration && ticket.formData?.variant ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Item</td><td style="padding:8px;border-bottom:1px solid #eee">${ticket.formData.variant} (${ticket.formData.size || ''} / ${ticket.formData.color || ''})</td></tr>` : ''}
              ${event.price ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Price</td><td style="padding:8px;border-bottom:1px solid #eee">₹${event.price}</td></tr>` : ''}
              <tr><td style="padding:8px;font-weight:bold">Status</td><td style="padding:8px;color:${statusColor};font-weight:bold">${ticket.status}</td></tr>
            </table>
            ${ticket.qrCode ? `<div style="text-align:center;margin:20px 0"><p style="color:#666">Your QR Code:</p><img src="${ticket.qrCode}" alt="QR Code" style="width:200px;height:200px" /></div>` : ''}
            ${!isRegistration && ticket.status === 'Pending Approval' ? '<p style="color:#f59e0b;font-size:14px">⏳ Your order is pending payment verification. You will receive another email once approved.</p>' : ''}
            ${isRegistration ? '<p style="color:#666;font-size:14px">Show the QR code above at the event entrance for check-in.</p>' : ''}
          </div>
          <div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#999">Felicity IIIT-H Event Management</div>
        </div>`
    });
    console.log(`✓ Ticket email sent to ${userEmail}`);
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
};

const postToDiscord = async (organizerId, event) => {
  try {
    const org = await User.findById(organizerId);
    if (!org || !org.discordWebhook) return;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD';

    const payload = {
      embeds: [{
        title: `📢 ${event.name}`,
        description: event.description || 'No description provided.',
        color: event.type === 'Merchandise' ? 0xf59e0b : 0x3b82f6,
        fields: [
          { name: 'Type', value: event.type, inline: true },
          { name: 'Date', value: fmtDate(event.startDate), inline: true },
          { name: 'Price', value: event.price ? `₹${event.price}` : 'Free', inline: true },
        ],
        footer: { text: `Published by ${org.name} • Felicity IIIT-H` },
        timestamp: new Date().toISOString()
      }]
    };

    // Use built-in fetch (Node 18+) — no external dependency needed
    const resp = await fetch(org.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`Discord webhook returned ${resp.status}: ${body}`);
    }
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
      const term = req.query.search;
      const regex = new RegExp(term, 'i');
      // Build a fuzzy regex: allow one character to be missing/different between each pair
      // e.g. "workshp" → "w.?o.?r.?k.?s.?h.?p" which matches "workshop"
      const fuzzyPattern = term.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.?');
      const fuzzyRegex = new RegExp(fuzzyPattern, 'i');
      filter.$or = [
        { name: regex }, { description: regex }, { tags: regex },
        { name: fuzzyRegex }, { description: fuzzyRegex }, { tags: fuzzyRegex }
      ];
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
      // Auto-determine status for each event
      for (const ev of events) await applyAutoStatus(ev);
      return res.json(events);
    }

    // Personalized ordering based on user interests
    let events = await Event.find(filter)
      .populate('organizer', 'name email category')
      .sort(sortObj);

    // Auto-determine status for each event
    for (const ev of events) await applyAutoStatus(ev);

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

    // Auto-determine status based on dates
    await applyAutoStatus(event);

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

    // Build formData: support both JSON body and multipart uploads
    let fd = req.body.formData || {};
    if (typeof fd === 'string') {
      try { fd = JSON.parse(fd); } catch { fd = {}; }
    }
    // Attach uploaded file paths to formData
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => {
        fd[f.fieldname] = `/uploads/${f.filename}`;
      });
    }

    // Validate required form fields
    if (event.formFields && event.formFields.length > 0) {
      const missing = event.formFields
        .filter(f => f.required)
        .filter(f => !fd[f.label] && fd[f.label] !== false && fd[f.label] !== 0);
      if (missing.length > 0) {
        return res.status(400).json({ msg: `Required fields missing: ${missing.map(f => f.label).join(', ')}` });
      }
    }

    const ticket = await Ticket.create({
      event: event._id,
      user: req.user.id,
      type: 'Registration',
      formData: fd,
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

    // Broadcast via Socket.IO for real-time updates
    const io = req.app.get('io');
    if (io) {
      const u = await User.findById(req.user.id, 'name');
      io.to(`event-${req.params.id}`).emit('commentAdded', {
        ...saved.toObject(),
        user: { _id: req.user.id, name: u?.name || 'User' }
      });
    }

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

    // Broadcast via Socket.IO for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`event-${req.params.id}`).emit('reactionUpdated', {
        commentId: req.params.commentId,
        reactions: comment.reactions
      });
    }

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
    // Auto-determine status for each event
    for (const ev of events) await applyAutoStatus(ev);
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

    const tickets = await Ticket.find({ event: event._id }).populate('user', 'name email participantType');
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
      .populate('user', 'name email');

    const header = 'Name,Email,Registration Date,Status,Attended\n';
    const rows = tickets.map((t) =>
      `${t.user?.name},${t.user?.email},${t.createdAt.toISOString()},${t.status},${t.attended}`
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

    // Broadcast via Socket.IO for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`event-${req.params.id}`).emit('commentDeleted', req.params.commentId);
    }

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

    // Broadcast via Socket.IO for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`event-${req.params.id}`).emit('commentPinned', {
        commentId: cid,
        pinnedComments: event.pinnedComments
      });
    }

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
