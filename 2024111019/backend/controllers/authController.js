const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, isIIIT, collegeName, contactNumber } = req.body;
    const name = req.body.name || `${firstName || ''} ${lastName || ''}`.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email and password are required' });
    }

    if (isIIIT && !email.endsWith('.iiit.ac.in')) {
      return res.status(400).json({ msg: 'Must use IIIT email' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      firstName: firstName || name.split(' ')[0],
      lastName: lastName || name.split(' ').slice(1).join(' '),
      email,
      password: hashedPassword,
      role: 'participant',
      participantType: isIIIT ? 'IIIT' : 'Non-IIIT',
      collegeName: collegeName || '',
      contactNumber: contactNumber || ''
    });

    const token = signToken(user);
    return res.status(201).json({
      msg: 'Registered successfully',
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    if (user.disabled) {
      return res.status(403).json({ msg: 'Account has been disabled. Contact admin.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('following', 'name category description email');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const allowedParticipant = ['firstName', 'lastName', 'contactNumber', 'collegeName', 'interests', 'following'];
    const allowedOrganizer = ['name', 'category', 'description', 'contactEmail', 'contactNumber', 'website', 'discordWebhook'];
    const allowed = user.role === 'organizer' ? allowedOrganizer : allowedParticipant;

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (user.role === 'participant' && (req.body.firstName || req.body.lastName)) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const { interests, following } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (interests) user.interests = interests;
    if (following) user.following = following;
    user.onboardingComplete = true;
    await user.save();

    return res.json({ msg: 'Onboarding complete', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ msg: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.requestReset = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'organizer') {
      return res.status(403).json({ msg: 'Only organizers can request reset approval' });
    }

    user.resetRequest = { status: 'Pending', reason: reason || '' };
    await user.save();

    return res.json({ msg: 'Password reset request submitted to admin' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getOrganizers = async (_req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer', disabled: { $ne: true } })
      .select('name category description email contactEmail');
    return res.json(organizers);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getOrganizerById = async (req, res) => {
  try {
    const organizer = await User.findOne({ _id: req.params.id, role: 'organizer' })
      .select('name category description email contactEmail website');
    if (!organizer) return res.status(404).json({ msg: 'Organizer not found' });
    return res.json(organizer);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.followOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const orgId = req.params.id;
    const idx = user.following.indexOf(orgId);
    if (idx === -1) {
      user.following.push(orgId);
    } else {
      user.following.splice(idx, 1);
    }
    await user.save();
    return res.json({ following: user.following });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// ============ Forgot Password (Public) ============
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'No account found with that email' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Try to send email
    if (process.env.SMTP_USER) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Password Reset - Felicity',
        html: `<h2>Password Reset Request</h2>
          <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0071e3;color:white;border-radius:8px;text-decoration:none">Reset Password</a>
          <p>Or use this token: <strong>${resetToken}</strong></p>`
      });
      return res.json({ msg: 'Password reset email sent. Check your inbox.' });
    }

    // No SMTP configured - return token directly (for development)
    return res.json({ msg: 'Reset token generated', resetToken, expiresIn: '15 minutes' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ msg: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ msg: 'Password must be at least 6 characters' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Invalid or expired reset token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ msg: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// ============ Google OAuth ============
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ msg: 'Google credential is required' });

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ msg: 'Google OAuth not configured on server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ msg: 'Google email not verified' });
    }

    // Check if user already exists (by googleId or email)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name: `${given_name || ''} ${family_name || ''}`.trim(),
        firstName: given_name || '',
        lastName: family_name || '',
        avatar: picture || '',
        role: 'participant',
        participantType: email.endsWith('.iiit.ac.in') ? 'IIIT' : 'Non-IIIT',
        onboardingComplete: false
      });
    }

    if (user.disabled) {
      return res.status(403).json({ msg: 'Account has been disabled. Contact admin.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ msg: 'Google authentication failed' });
  }
};
