/**
 * One-time: upgrades users whose password field is plaintext to bcrypt hashes.
 * Run: node rehash-plaintext-passwords.js
 * Requires MONGO_URI in .env (same as server).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

function storedPasswordLooksBcrypt(stored) {
  return typeof stored === 'string' && /^\$2[aby]\$\d{2}\$/.test(stored);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({});
  const saltRounds = 10;
  let updated = 0;
  for (const user of users) {
    const stored = user.password;
    if (storedPasswordLooksBcrypt(stored)) continue;
    const plain = String(stored).trim();
    user.password = await bcrypt.hash(plain, saltRounds);
    await user.save();
    updated += 1;
    console.log(`Hashed password for: ${user.username}`);
  }
  console.log(updated ? `Done. Updated ${updated} user(s).` : 'No plaintext passwords found.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
