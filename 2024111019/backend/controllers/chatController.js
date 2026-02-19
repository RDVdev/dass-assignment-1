const Message = require('../models/Message');
const Team = require('../models/Team');

// Get messages for a team (paginated)
exports.getMessages = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    // Only team members can view messages
    if (!team.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'Not a member of this team' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ team: req.params.teamId })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ team: req.params.teamId });

    return res.json({ messages: messages.reverse(), total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    if (!team.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'Not a member of this team' });
    }

    const message = await Message.create({
      team: req.params.teamId,
      sender: req.user.id,
      text: req.body.text,
      fileUrl: req.body.fileUrl || undefined
    });

    const populated = await Message.findById(message._id).populate('sender', 'name email');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};
