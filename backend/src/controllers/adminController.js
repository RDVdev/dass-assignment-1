import User from '../models/User.js';
import OrganizerProfile from '../models/OrganizerProfile.js';
import { ROLES } from '../utils/constants.js';

export const createOrganizer = async (req, res) => {
  const { name, email, password, clubName, contactEmail, contactPhone, clubDescription } = req.body;

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Organizer email already exists' });

  const organizer = await User.create({
    name,
    email,
    password,
    role: ROLES.ORGANIZER,
    createdByAdmin: true
  });

  const profile = await OrganizerProfile.create({
    organizer: organizer._id,
    clubName,
    contactEmail,
    contactPhone,
    clubDescription
  });

  res.status(201).json({ organizer, profile });
};

export const listOrganizers = async (_req, res) => {
  const organizers = await User.find({ role: ROLES.ORGANIZER }).select('-password');
  const profiles = await OrganizerProfile.find({ organizer: { $in: organizers.map((o) => o._id) } });

  const merged = organizers.map((org) => ({
    ...org.toObject(),
    profile: profiles.find((p) => String(p.organizer) === String(org._id)) || null
  }));

  res.json({ organizers: merged });
};

export const deactivateOrganizer = async (req, res) => {
  const organizer = await User.findOne({ _id: req.params.id, role: ROLES.ORGANIZER });
  if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

  organizer.isActive = false;
  await organizer.save();
  res.json({ message: 'Organizer deactivated' });
};
