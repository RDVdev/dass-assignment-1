const Team = require('../models/Team');
const Event = require('../models/Event');

const generateCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

exports.createTeam = async (req, res) => {
  try {
    const { name, eventId, maxMembers } = req.body;

    const event = await Event.findById(eventId);
    if (!event || event.type !== 'Hackathon') {
      return res.status(400).json({ msg: 'Team registration only allowed for hackathons' });
    }

    let inviteCode;
    let exists = true;
    while (exists) {
      inviteCode = generateCode();
      // eslint-disable-next-line no-await-in-loop
      exists = await Team.findOne({ inviteCode });
    }

    const team = await Team.create({
      name,
      event: eventId,
      leader: req.user.id,
      members: [req.user.id],
      maxMembers: maxMembers || 4,
      inviteCode
    });

    return res.status(201).json(team);
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode });

    if (!team) return res.status(404).json({ msg: 'Invalid invite code' });
    if (team.members.some((id) => id.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already in this team' });
    }
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ msg: 'Team is full' });
    }

    team.members.push(req.user.id);
    await team.save();

    return res.json(team);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id }).populate('event', 'name type');
    return res.json(teams);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
