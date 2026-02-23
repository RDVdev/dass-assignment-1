const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();
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
