const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, isIIIT } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email and password are required' });
    }

    if (isIIIT && !email.endsWith('@students.iiit.ac.in')) {
      return res.status(400).json({ msg: 'Must use IIIT email' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'participant',
      participantType: isIIIT ? 'IIIT' : 'Non-IIIT'
    });

    const token = signToken(user);
    return res.status(201).json({
      msg: 'Registered successfully',
      token,
      user: { id: user._id, role: user.role, name: user.name, email: user.email }
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

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, role: user.role, name: user.name, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(user);
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
