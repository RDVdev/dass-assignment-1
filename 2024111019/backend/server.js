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

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Socket.io for real-time discussion
const onlineUsers = new Map(); // socketId -> { userId, userName }

io.on('connection', (socket) => {
  // ---------- Event Discussion ----------
  socket.on('joinEvent', (eventId) => {
    socket.join(`event-${eventId}`);
  });

  socket.on('leaveEvent', (eventId) => {
    socket.leave(`event-${eventId}`);
  });

  socket.on('newComment', (data) => {
    io.to(`event-${data.eventId}`).emit('commentAdded', data.comment);
  });

  socket.on('deleteComment', (data) => {
    io.to(`event-${data.eventId}`).emit('commentDeleted', data.commentId);
  });

  socket.on('pinComment', (data) => {
    io.to(`event-${data.eventId}`).emit('commentPinned', data);
  });

  socket.on('reactionToggled', (data) => {
    io.to(`event-${data.eventId}`).emit('reactionUpdated', data);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
