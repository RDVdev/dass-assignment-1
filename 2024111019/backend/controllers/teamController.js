const Team = require('../models/Team');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const QRCode = require('qrcode');

const generateCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

exports.createTeam = async (req, res) => {
  try {
    const { name, eventId, maxMembers } = req.body;

    const event = await Event.findById(eventId);
    if (!event || event.type !== 'Hackathon') {
      return res.status(400).json({ msg: 'Team registration only allowed for hackathons' });
    }
    if (event.status !== 'Published' && event.status !== 'Ongoing') {
      return res.status(400).json({ msg: 'Event is not open for registration' });
    }

    // Check user isn't already in a team for this event
    const existing = await Team.findOne({ event: eventId, members: req.user.id });
    if (existing) return res.status(400).json({ msg: 'You are already in a team for this event' });

    let inviteCode;
    let exists = true;
    while (exists) {
      inviteCode = generateCode();
      exists = await Team.findOne({ inviteCode });
    }

    const teamSize = maxMembers || event.maxTeamSize || 4;

    const team = await Team.create({
      name,
      event: eventId,
      leader: req.user.id,
      members: [req.user.id],
      maxMembers: teamSize,
      inviteCode,
      status: 'Forming'
    });

    return res.status(201).json(team);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode }).populate('event', 'name type status maxTeamSize');

    if (!team) return res.status(404).json({ msg: 'Invalid invite code' });
    if (team.status === 'Registered') return res.status(400).json({ msg: 'Team already registered' });
    if (team.members.some((id) => id.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already in this team' });
    }
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ msg: 'Team is full' });
    }

    // Check user isn't in another team for same event
    const otherTeam = await Team.findOne({ event: team.event._id, members: req.user.id });
    if (otherTeam) return res.status(400).json({ msg: 'You are already in another team for this event' });

    team.members.push(req.user.id);

    // Auto-complete if team is full
    if (team.members.length >= team.maxMembers) {
      team.status = 'Complete';
    }

    await team.save();
    return res.json(team);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Register a complete team - generates tickets for all members
exports.registerTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('event');
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only team leader can register the team' });
    }
    if (team.status === 'Registered') {
      return res.status(400).json({ msg: 'Team already registered' });
    }

    const event = team.event;
    const minSize = event.minTeamSize || 2;
    if (team.members.length < minSize) {
      return res.status(400).json({ msg: `Need at least ${minSize} members to register` });
    }

    // Generate tickets for all members
    const tickets = [];
    for (const memberId of team.members) {
      const existing = await Ticket.findOne({ event: event._id, user: memberId, status: { $ne: 'Cancelled' } });
      if (existing) continue;

      const ticket = await Ticket.create({
        event: event._id,
        user: memberId,
        type: 'Registration',
        team: team._id,
        status: 'Confirmed'
      });
      const qrData = JSON.stringify({ ticketId: ticket.ticketId, event: event.name, team: team.name });
      ticket.qrCode = await QRCode.toDataURL(qrData);
      await ticket.save();
      tickets.push(ticket);
    }

    team.status = 'Registered';
    await team.save();

    event.registrationCount = (event.registrationCount || 0) + tickets.length;
    await event.save();

    return res.json({ msg: 'Team registered successfully', tickets, team });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id })
      .populate('event', 'name type status startDate')
      .populate('members', 'name email')
      .populate('leader', 'name email');
    return res.json(teams);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('event', 'name type status startDate minTeamSize maxTeamSize')
      .populate('members', 'name email')
      .populate('leader', 'name email');
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    return res.json(team);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.status === 'Registered') return res.status(400).json({ msg: 'Cannot leave a registered team' });
    if (team.leader.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Leader cannot leave. Delete the team instead.' });
    }

    team.members = team.members.filter(m => m.toString() !== req.user.id);
    if (team.status === 'Complete') team.status = 'Forming';
    await team.save();
    return res.json({ msg: 'Left the team', team });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only leader can delete the team' });
    }
    if (team.status === 'Registered') return res.status(400).json({ msg: 'Cannot delete a registered team' });

    await team.deleteOne();
    return res.json({ msg: 'Team deleted' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
