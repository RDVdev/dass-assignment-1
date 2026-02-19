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
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Socket.io for real-time discussion + team chat
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

  // ---------- Team Chat ----------
  socket.on('joinTeam', ({ teamId, userId, userName }) => {
    socket.join(`team-${teamId}`);
    onlineUsers.set(socket.id, { userId, userName, teamId });
    const teamMembers = [...onlineUsers.values()].filter(u => u.teamId === teamId);
    io.to(`team-${teamId}`).emit('onlineMembers', teamMembers.map(u => ({ userId: u.userId, userName: u.userName })));
  });

  socket.on('leaveTeam', (teamId) => {
    socket.leave(`team-${teamId}`);
    onlineUsers.delete(socket.id);
    const teamMembers = [...onlineUsers.values()].filter(u => u.teamId === teamId);
    io.to(`team-${teamId}`).emit('onlineMembers', teamMembers.map(u => ({ userId: u.userId, userName: u.userName })));
  });

  socket.on('teamMessage', (data) => {
    io.to(`team-${data.teamId}`).emit('newTeamMessage', data.message);
  });

  socket.on('typing', ({ teamId, userName }) => {
    socket.to(`team-${teamId}`).emit('userTyping', { userName });
  });

  socket.on('stopTyping', ({ teamId }) => {
    socket.to(`team-${teamId}`).emit('userStoppedTyping');
  });

  socket.on('disconnect', () => {
    const userData = onlineUsers.get(socket.id);
    if (userData?.teamId) {
      onlineUsers.delete(socket.id);
      const teamMembers = [...onlineUsers.values()].filter(u => u.teamId === userData.teamId);
      io.to(`team-${userData.teamId}`).emit('onlineMembers', teamMembers.map(u => ({ userId: u.userId, userName: u.userName })));
    }
    onlineUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
