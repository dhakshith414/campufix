#!/usr/bin/env node
/**
 * CampusFix Admin Bootstrap Script
 * 
 * Creates the first administrator account securely.
 * 
 * Usage:
 *   ADMIN_NAME="Your Name" ADMIN_EMAIL="admin@campus.edu" ADMIN_PASSWORD="SecurePass123" node scripts/createAdmin.js
 * 
 * Or with .env loaded:
 *   node scripts/createAdmin.js
 * 
 * Required environment variables (set in .env or shell):
 *   MONGODB_URI, JWT_SECRET
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set');
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error('ERROR: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set');
    console.error('Usage: ADMIN_NAME="Admin" ADMIN_EMAIL="admin@campus.edu" ADMIN_PASSWORD="Pass123!" node scripts/createAdmin.js');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ERROR: Admin password must be at least 8 characters');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: 'campusfix' });
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin account already exists: ${email}`);
    } else {
      await User.findByIdAndUpdate(existing._id, { role: 'admin' });
      console.log(`Existing account promoted to admin: ${email}`);
    }
  } else {
    const passwordHash = await User.hashPassword(password);
    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
    });
    console.log(`Admin account created: ${admin.email} (id: ${admin._id})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
