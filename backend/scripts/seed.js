#!/usr/bin/env node
/**
 * CampusFix Seed Script
 * Creates demo accounts and sample issues for demonstration.
 * 
 * Usage: node scripts/seed.js
 * WARNING: This creates demo data. Run only in development.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Issue = require('../src/models/Issue');
const IssueActivity = require('../src/models/IssueActivity');

const DEMO_ACCOUNTS = [
  { name: 'Admin User', email: 'admin@campusfix.demo', password: 'Admin@123', role: 'admin', department: 'Administration' },
  { name: 'John Staff', email: 'staff@campusfix.demo', password: 'Staff@123', role: 'staff', department: 'Maintenance' },
  { name: 'Jane Student', email: 'student@campusfix.demo', password: 'Student@123', role: 'student' },
];

const SAMPLE_ISSUES = [
  {
    title: 'Projector not working in B-204',
    description: 'The projector in classroom B-204 has been non-functional since Monday. It shows no signal when connected to any laptop. Affecting 3 classes daily.',
    category: 'Classroom Equipment',
    location: { building: 'Block B', room: '204', additionalDetail: 'Near the main board' },
    priority: 'High',
    status: 'In Progress',
  },
  {
    title: 'Water leak in men\'s restroom',
    description: 'There is a persistent water leak from the pipe under the sink in the men\'s restroom on the 2nd floor of the Main Building. Water is pooling on the floor.',
    category: 'Plumbing & Water',
    location: { building: 'Main Building', room: 'Restroom 2F' },
    priority: 'Critical',
    status: 'Acknowledged',
  },
  {
    title: 'Wi-Fi dead zone in Library Reading Room',
    description: 'No Wi-Fi signal in the east wing of the library reading room. Students cannot access online resources during study hours.',
    category: 'Internet & Wi-Fi',
    location: { building: 'Library', room: 'East Reading Room', additionalDetail: 'Entire east wing' },
    priority: 'Medium',
    status: 'Submitted',
  },
  {
    title: 'Flickering lights in Lab 3',
    description: 'Fluorescent lights in Computer Lab 3 have been flickering intermittently. This is causing headaches and affecting concentration.',
    category: 'Electrical',
    location: { building: 'Science Block', room: 'Lab 3' },
    priority: 'Medium',
    status: 'Resolved',
    resolutionNote: 'Replaced faulty ballast and two fluorescent tubes. All lights working correctly.',
  },
  {
    title: 'Broken chairs in Seminar Hall A',
    description: 'At least 8 chairs in Seminar Hall A have broken armrests or unstable legs. Safety hazard for students.',
    category: 'Furniture & Infrastructure',
    location: { building: 'Academic Block', room: 'Seminar Hall A' },
    priority: 'Low',
    status: 'Submitted',
  },
];

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script must not run in production');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('ERROR: MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri, { dbName: 'campusfix' });
  console.log('Connected to MongoDB\n');

  // Create demo users
  const userMap = {};
  for (const account of DEMO_ACCOUNTS) {
    let user = await User.findOne({ email: account.email }).select('+passwordHash');
    if (!user) {
      const passwordHash = await User.hashPassword(account.password);
      user = await User.create({
        name: account.name,
        email: account.email,
        passwordHash,
        role: account.role,
        department: account.department || '',
        isActive: true,
      });
      console.log(`✓ Created ${account.role}: ${account.email} / ${account.password}`);
    } else {
      console.log(`  Existing ${account.role}: ${account.email}`);
    }
    userMap[account.role] = user;
  }

  // Create sample issues
  console.log('\nCreating sample issues...');
  const { CATEGORIES } = require('../src/models/Issue');

  for (const issueData of SAMPLE_ISSUES) {
    const existing = await Issue.findOne({ title: issueData.title });
    if (existing) {
      console.log(`  Existing: ${issueData.title}`);
      continue;
    }

    const issue = await Issue.create({
      ...issueData,
      reporter: userMap['student']._id,
      assignee: issueData.status !== 'Submitted' ? userMap['staff']._id : null,
      resolvedAt: issueData.status === 'Resolved' ? new Date() : null,
    });

    await IssueActivity.create({
      issue: issue._id,
      actor: userMap['student']._id,
      action: 'created',
      newValue: 'Submitted',
      note: 'Issue submitted',
    });

    if (issueData.status !== 'Submitted') {
      await IssueActivity.create({
        issue: issue._id,
        actor: userMap['staff']._id,
        action: 'status_changed',
        previousValue: 'Submitted',
        newValue: issueData.status,
      });
    }

    console.log(`✓ Issue [${issue.issueCode}]: ${issue.title}`);
  }

  console.log('\n--- Demo Credentials ---');
  console.log('Admin:   admin@campusfix.demo / Admin@123');
  console.log('Staff:   staff@campusfix.demo / Staff@123');
  console.log('Student: student@campusfix.demo / Student@123');
  console.log('------------------------\n');

  await mongoose.disconnect();
  console.log('Seed complete.');
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
