require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const email = process.env.ADMIN_EMAIL;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`Admin with email ${email} already exists. Skipping.`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await User.create({
      name: process.env.ADMIN_NAME,
      email,
      password: hashed,
      address: process.env.ADMIN_ADDRESS,
      role: 'ADMIN',
    });

    console.log(`Admin account created: ${email} / ${process.env.ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
