const ForumMessage = require('../models/ForumMessage');
const Event = require('../models/Event');
const User = require('../models/User');

// Get messages for an event (paginated)
exports.getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ForumMessage.find({ event: eventId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ForumMessage.countDocuments({ event: eventId });

    res.json({
      messages: messages.reverse(), // oldest first for chat display
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Post a message
exports.postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { text, parentMessage } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ msg: 'Message cannot be empty' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    const user = await User.findById(userId, 'name role');

    const message = new ForumMessage({
      event: eventId,
      user: userId,
      text: text.trim(),
      userName: user?.name || 'User',
      userRole: user?.role || 'participant',
      parentMessage: parentMessage || null
    });

    await message.save();

    // Emit via Socket.IO to all clients in the event room
    const io = req.app.get('io');
    if (io) {
      io.to(`event_${eventId}`).emit('newMessage', message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Toggle reaction on a message
exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await ForumMessage.findById(messageId);
    if (!message) return res.status(404).json({ msg: 'Message not found' });

    const reactionEmoji = emoji || '👍';
    const existing = message.reactions.find(
      r => r.user.toString() === userId && r.emoji === reactionEmoji
    );

    if (existing) {
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === userId && r.emoji === reactionEmoji)
      );
    } else {
      message.reactions.push({ user: userId, emoji: reactionEmoji });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`event_${message.event}`).emit('reactionUpdated', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({ reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Delete a message (organizer/admin moderation)
exports.deleteMessage = async (req, res) => {
  try {
    const { eventId, messageId } = req.params;

    await ForumMessage.findByIdAndDelete(messageId);

    const io = req.app.get('io');
    if (io) {
      io.to(`event_${eventId}`).emit('messageDeleted', messageId);
    }

    res.json({ msg: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Pin/unpin a message (organizer/admin)
exports.pinMessage = async (req, res) => {
  try {
    const { eventId, messageId } = req.params;

    const message = await ForumMessage.findById(messageId);
    if (!message) return res.status(404).json({ msg: 'Message not found' });

    message.pinned = !message.pinned;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`event_${eventId}`).emit('messagePinned', {
        messageId: message._id,
        pinned: message.pinned
      });
    }

    res.json({ msg: message.pinned ? 'Message pinned' : 'Message unpinned', pinned: message.pinned });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
