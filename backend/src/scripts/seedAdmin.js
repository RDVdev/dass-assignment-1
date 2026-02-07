import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@iiit.ac.in';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  await User.create({
    name: 'System Admin',
    email,
    password,
    role: ROLES.ADMIN,
    createdByAdmin: true
  });

  console.log('Seeded admin:', email);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
