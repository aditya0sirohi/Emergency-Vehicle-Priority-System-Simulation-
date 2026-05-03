// backend/health-check.js
// Run this to verify MongoDB Atlas is working: node health-check.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function healthCheck() {
  console.log('🔍 Starting MongoDB Atlas Health Check...\n');

  try {
    // 1. TEST CONNECTION
    console.log('1️⃣  Testing Connection to MongoDB Atlas...');
    const client = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });

    console.log('   ✅ Connected Successfully!\n');

    // 2. PING DATABASE
    console.log('2️⃣  Pinging Database...');
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log('   ✅ Ping Response:', pingResult, '\n');

    // 3. LIST DATABASES
    console.log('3️⃣  Available Databases:');
    const databases = await mongoose.connection.db.admin().listDatabases();
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    console.log();

    // 4. CHECK USER COLLECTION
    console.log('4️⃣  Checking User Collection...');
    const userCount = await User.countDocuments();
    console.log(`   ✅ User collection exists with ${userCount} documents\n`);

    // 5. LIST USER DOCUMENTS (first 3)
    if (userCount > 0) {
      console.log('5️⃣  Sample Users:');
      const users = await User.find().limit(3).select('username role vehicleNumber -_id');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.role}${user.vehicleNumber ? ', Vehicle: ' + user.vehicleNumber : ''})`);
      });
      console.log();
    }

    // 6. CHECK INDEXES
    console.log('6️⃣  Checking Indexes...');
    const indexes = await User.collection.getIndexes();
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}:`, JSON.stringify(indexes[indexName]));
    });
    console.log();

    // 7. SUMMARY
    console.log('========================================');
    console.log('✅ MongoDB Atlas Health Check PASSED');
    console.log('========================================');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`User Documents: ${userCount}`);
    console.log('Status: READY FOR PRODUCTION');

  } catch (error) {
    console.error('\n❌ Health Check FAILED');
    console.error('========================================');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Suggestion: DNS resolution failed. Check your internet connection.');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Suggestion: Invalid MongoDB credentials in .env file.');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Suggestion: MongoDB Atlas not responding. Check cluster status on dashboard.');
    }
    
    console.error('\n🔗 Debugging Steps:');
    console.error('1. Verify MONGO_URI in your .env file');
    console.error('2. Check IP Whitelist in MongoDB Atlas (Network Access)');
    console.error('3. Ensure cluster is running (check cloud.mongodb.com)');
    console.error('4. Test connection string manually: mongosh "your_uri"');

  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the health check
healthCheck().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
