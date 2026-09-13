require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User } = require('../models');
const env = require('../config/env');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const existing = await User.scope('withPassword').findOne({
      where: { email: env.admin.email },
    });

    if (existing) {
      console.log(`Admin user already exists: ${env.admin.email}`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(env.admin.password, 10);
    await User.create({
      name: env.admin.name,
      email: env.admin.email,
      password: hashed,
      role: env.admin.role === 'doctor' ? 'doctor' : 'admin',
    });

    console.log('Seeded admin user successfully');
    console.log(`  Email: ${env.admin.email}`);
    console.log(`  Password: ${env.admin.password}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
