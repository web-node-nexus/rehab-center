require('dotenv').config();
const mysql = require('mysql2/promise');
const sequelize = require('../config/db');
const env = require('../config/env');
require('../models');

const syncDb = async () => {
  try {
    // Create database if it does not exist
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();

    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log(`Database "${env.db.name}" synced successfully`);
    process.exit(0);
  } catch (err) {
    console.error('DB sync failed:', err.message);
    process.exit(1);
  }
};

syncDb();
