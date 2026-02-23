const mongoose = require('mongoose');
require('dotenv').config({path: __dirname + '/backend/.env'});
const User = require('./backend/models/User');
const Ticket = require('./backend/models/Ticket');
const bcrypt = require('bcryptjs');

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  // Delete test users
  const testEmails = [
    'testa1@students.iiit.ac.in',
    'testb2@college.edu',
    'outsider99@college.edu',
    'testuser99@students.iiit.ac.in',
    'testclub@iiit.ac.in',
    'test.user@students.iiit.ac.in',
    'external@college.edu'
  ];

  // Find test user IDs first to clean their tickets
  const testUsers = await User.find({email: {$in: testEmails}});
  const testUserIds = testUsers.map(u => u._id);

  if (testUserIds.length > 0) {
    await Ticket.deleteMany({user: {$in: testUserIds}});
    console.log('Cleaned test tickets');
  }

  await User.deleteMany({email: {$in: testEmails}});
  console.log('Cleaned test users');

  // Reset organizer password
  const org = await User.findOne({email: 'ecell@iiit.ac.in'});
  if (org) {
    org.password = await bcrypt.hash('Pass@123', 10);
    org.resetRequest = {status: 'None', reason: ''};
    await org.save();
    console.log('Reset organizer');
  }

  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
