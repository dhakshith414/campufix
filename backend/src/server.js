require('dotenv').config();
const connectDB = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`CampusFix API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start();
