import crypto from 'crypto';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { signToken } from '../utils/jwt.js';
import { ROLES } from '../utils/constants.js';

export const signupParticipant = async (req, res) => {
  const { name, email, password, profile } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const user = await User.create({
    name,
    email,
    password,
    profile,
    role: ROLES.PARTICIPANT
  });

  const token = signToken({ id: user._id, role: user.role });
  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isIIIT: user.isIIIT
    }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const matched = await user.comparePassword(password);
  if (!matched) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken({ id: user._id, role: user.role });
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isIIIT: user.isIIIT
    }
  });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const requestOrganizerPasswordReset = async (req, res) => {
  const { organizerId } = req.body;
  const organizer = await User.findOne({ _id: organizerId, role: ROLES.ORGANIZER });

  if (!organizer) {
    return res.status(404).json({ message: 'Organizer not found' });
  }

  const rawToken = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await PasswordResetToken.create({
    user: organizer._id,
    token: rawToken,
    expiresAt
  });

  res.json({
    message: 'Password reset token generated',
    resetToken: rawToken,
    expiresAt
  });
};

export const resetOrganizerPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const resetDoc = await PasswordResetToken.findOne({ token, used: false });
  if (!resetDoc || resetDoc.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  const organizer = await User.findById(resetDoc.user).select('+password');
  if (!organizer || organizer.role !== ROLES.ORGANIZER) {
    return res.status(404).json({ message: 'Organizer not found' });
  }

  organizer.password = newPassword;
  await organizer.save();

  resetDoc.used = true;
  await resetDoc.save();

  res.json({ message: 'Organizer password updated' });
};
