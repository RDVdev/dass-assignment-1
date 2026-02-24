const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { transporter, isMailConfigured, getMailDebugConfig, getSmtpUser } = require('./config/mailer');
connectDB();

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(null, true); // allow all for now, tighten later
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Temporary: test email endpoint (remove after verification)
app.get('/api/test-email', async (_req, res) => {
  const QRCode = require('qrcode');
  if (!isMailConfigured()) {
    return res.json({ error: 'SMTP not configured', ...getMailDebugConfig() });
  }
  try {
    const qr = await QRCode.toDataURL(JSON.stringify({ ticketId: 'TKT-RENDER-TEST', event: 'Deploy Test' }));
    const base64Data = qr.replace(/^data:image\/png;base64,/, '');
    await transporter.sendMail({
      from: `"Felicity IIIT-H" <${getSmtpUser()}>`,
      to: '13devanshbansal@gmail.com',
      subject: '🎫 DEPLOYED: Registration Test with QR',
      attachments: [{ filename: 'qrcode.png', content: Buffer.from(base64Data, 'base64'), cid: 'qrcode@felicity' }],
      html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden"><div style="background:#3b82f6;color:white;padding:20px;text-align:center"><h1 style="margin:0">Deployed Email Works!</h1></div><div style="padding:24px"><p>This email was sent from the <strong>Render deployed server</strong>.</p><p>Ticket: TKT-RENDER-TEST</p><div style="text-align:center;margin:20px 0"><img src="cid:qrcode@felicity" alt="QR" style="width:200px;height:200px" /></div></div></div>'
    });
    return res.json({ success: true, sentTo: '13devanshbansal@gmail.com' });
  } catch (e) {
    return res.json({
      error: e.message,
      code: e.code,
      responseCode: e.responseCode,
      response: e.response,
      ...getMailDebugConfig()
    });
  }
});

// Make io accessible from route handlers via req.app.get('io')
app.set('io', io);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/forum', require('./routes/forumRoutes'));

// Socket.io for real-time discussion forum
io.on('connection', (socket) => {
  // Forum room management (using event_ prefix like the dedicated forum system)
  socket.on('joinEventForum', (eventId) => {
    socket.join(`event_${eventId}`);
  });

  socket.on('leaveEventForum', (eventId) => {
    socket.leave(`event_${eventId}`);
  });

  // Legacy room handlers (kept for backwards compatibility)
  socket.on('joinEvent', (eventId) => {
    socket.join(`event_${eventId}`);
  });

  socket.on('leaveEvent', (eventId) => {
    socket.leave(`event_${eventId}`);
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
