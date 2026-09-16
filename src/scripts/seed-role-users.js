require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { User } = require('../models');

const ACCOUNTS = [
  {
    name: 'Doctor',
    email: process.env.DOCTOR_EMAIL || 'doctor@rehabcenter.com',
    password: process.env.DOCTOR_PASSWORD || 'Doctor@123',
    role: 'doctor',
  },
  {
    name: 'Staff',
    email: process.env.STAFF_EMAIL || 'staff@rehabcenter.com',
    password: process.env.STAFF_PASSWORD || 'Staff@123',
    role: 'staff',
  },
  {
    name: 'Psychologist',
    email: process.env.PSYCHOLOGIST_EMAIL || 'psychologist@rehabcenter.com',
    password: process.env.PSYCHOLOGIST_PASSWORD || 'Psych@123',
    role: 'psychologist',
  },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin','doctor','staff','psychologist') NOT NULL DEFAULT 'admin'"
    );

    for (const account of ACCOUNTS) {
      const existing = await User.scope('withPassword').findOne({
        where: { email: account.email },
      });
      if (existing) {
        if (existing.role !== account.role) {
          await existing.update({ role: account.role, name: account.name });
          console.log(`Updated role for ${account.email} → ${account.role}`);
        } else {
          console.log(`Already exists: ${account.email} (${account.role})`);
        }
        continue;
      }
      const hashed = await bcrypt.hash(account.password, 10);
      await User.create({
        name: account.name,
        email: account.email,
        password: hashed,
        role: account.role,
      });
      console.log(`Created ${account.role}: ${account.email} / ${account.password}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Role seed failed:', err.message);
    process.exit(1);
  }
};

seed();
