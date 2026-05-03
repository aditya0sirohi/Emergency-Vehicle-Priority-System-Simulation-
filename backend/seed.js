// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

const seedUsers = async () => {
  try {
    // 1. Connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to DB...');

    // 2. Clear old data (optional, but good for testing)
    await User.deleteMany({});
    console.log('🧹 Cleared existing users...');

    // 3. Create our Heroes (with hashed passwords)
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash('pass123', saltRounds);
    const driverPasswordHash = await bcrypt.hash('pass123', saltRounds);

    const users = [
      {
        username: 'admin',
        password: adminPasswordHash, // Hashed password
        role: 'admin'
      },
      {
        username: 'driver1',
        password: driverPasswordHash, // Hashed password
        role: 'ambulance',
        vehicleNumber: 'UK-07-AMB-999'
      }
    ];

    // 4. Save them
    await User.insertMany(users);
    console.log('✅ Users Injected Successfully!');
    console.log('   1. Admin: admin / pass123');
    console.log('   2. Driver: driver1 / pass123');

    // 5. Disconnect
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

seedUsers();