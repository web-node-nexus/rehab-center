require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || `http://localhost:${process.env.PORT || 4000}`,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'rehab_center',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Admin Doctor',
    email: process.env.ADMIN_EMAIL || 'admin@rehabcenter.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: process.env.ADMIN_ROLE || 'admin',
  },
};
