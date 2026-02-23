const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Team = require('./models/Team');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Reset organizer password
  const org = await User.findOne({ email: 'ecell@iiit.ac.in' });
  if (org) {
    org.password = await bcrypt.hash('Pass@123', 10);
    org.resetRequest = { status: 'None', reason: '' };
    await org.save();
    console.log('Organizer password reset');
  }

  // Clean test users and their data
  const emails = ['testa1@students.iiit.ac.in', 'testb2@college.edu', 'outsider99@college.edu', 'testclub@iiit.ac.in'];
  const users = await User.find({ email: { $in: emails } });
  const ids = users.map(u => u._id);
  if (ids.length) {
    await Ticket.deleteMany({ user: { $in: ids } });
    await Team.deleteMany({ leader: { $in: ids } });
  }
  const result = await User.deleteMany({ email: { $in: emails } });
  console.log('Deleted test users:', result.deletedCount);

  // Clean test events created by organizer
  const Event = require('./models/Event');
  await Event.deleteMany({ name: 'Test Workshop' });
  console.log('Cleaned test events');

  process.exit(0);
});
