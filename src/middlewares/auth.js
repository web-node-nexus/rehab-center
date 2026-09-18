const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User, DeviceSession } = require('../models');
const AppError = require('../utils/AppError');
const { touchSession } = require('../controllers/adminController');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (decoded.sid) {
      try {
        const session = await DeviceSession.findByPk(decoded.sid);
        if (!session || !session.is_active || session.user_id !== user.id) {
          throw new AppError('Session expired. Please sign in again.', 401);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        // Ignore missing table during rollout
      }
    }

    const deviceId = decoded.device_id || req.headers['x-device-id'];
    if (deviceId) {
      touchSession(user.id, deviceId).catch(() => {});
    }

    req.user = user;
    req.jwtRole = decoded.role || null;
    req.deviceId = deviceId || null;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
