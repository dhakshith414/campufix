#!/usr/bin/env node
/**
 * CampusFix Admin Bootstrap Script
 * 
 * Securely creates or promotes the first administrator account.
 * Credentials are NEVER hardcoded.
 * 
 * Usage options:
 * 1. Interactive terminal prompt:
 *      node scripts/createAdmin.js
 * 
 * 2. Environment variables:
 *      ADMIN_NAME="Campus Director" ADMIN_EMAIL="admin@university.edu" ADMIN_PASSWORD="SecurePass123!" node scripts/createAdmin.js
 */
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const promptQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  let name = process.env.ADMIN_NAME;
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  let department = process.env.ADMIN_DEPARTMENT || 'Administration';

  // If environment variables were not supplied, prompt interactively
  if (!name || !email || !password) {
    if (process.stdin.isTTY) {
      console.log('\n--- CampusFix Administrator Provisioning ---');
      console.log('Provide details to bootstrap the primary administrator account:\n');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      if (!name) name = await promptQuestion(rl, 'Full Name: ');
      if (!email) email = await promptQuestion(rl, 'Admin Email: ');
      if (!password) password = await promptQuestion(rl, 'Admin Password (min 8 chars): ');

      rl.close();
    } else {
      console.error('ERROR: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be provided as environment variables when not running in an interactive TTY.');
      console.error('Example: ADMIN_NAME="Admin" ADMIN_EMAIL="admin@campus.edu" ADMIN_PASSWORD="Password@123" node scripts/createAdmin.js');
      process.exit(1);
    }
  }

  if (!name || name.length < 2) {
    console.error('ERROR: Name must be at least 2 characters.');
    process.exit(1);
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('ERROR: A valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('ERROR: Password must be at least 8 characters long.');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: 'campusfix' });
  console.log('\nConnected to MongoDB database.');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role === 'admin' && existing.isActive) {
      console.log(`Administrator account already exists: ${existing.email} (ID: ${existing._id})`);
    } else {
      await User.findByIdAndUpdate(existing._id, { role: 'admin', isActive: true });
      console.log(`Existing user [${existing.email}] has been successfully promoted to Administrator.`);
    }
  } else {
    const passwordHash = await User.hashPassword(password);
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      department,
      isActive: true,
    });
    console.log(`✓ Admin account created successfully!`);
    console.log(`  Name:  ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role:  ${admin.role}`);
    console.log(`  ID:    ${admin._id}`);
  }

  await mongoose.disconnect();
  console.log('\nSetup completed safely. Disconnected from database.\n');
};

run().catch((err) => {
  console.error('Bootstrap failed:', err.message);
  process.exit(1);
});
