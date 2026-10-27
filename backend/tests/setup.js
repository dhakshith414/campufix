require('dotenv').config();
const mongoose = require('mongoose');

beforeAll(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required for running tests');
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { dbName: 'campusfix_test' });
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Optionally clean collections or drop database
    await mongoose.connection.close();
  }
}, 15000);
