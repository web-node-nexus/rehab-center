const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { User } = require('../models');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { success } = require('../utils/helpers');
const { upsertSession } = require('./adminController');

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidators = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  }),
];

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    let user = await User.scope('withPassword').findOne({
      where: { email: normalizedEmail },
    });
    // Fallback for older rows with mixed-case emails
    if (!user) {
      const { fn, col, where } = require('sequelize');
      user = await User.scope('withPassword').findOne({
        where: where(fn('LOWER', col('email')), normalizedEmail),
      });
    }
    if (!user) throw new AppError('Invalid email or password', 401);

    const match = await bcrypt.compare(String(password || ''), user.password);
    if (!match) throw new AppError('Invalid email or password', 401);

    let session = null;
    try {
      session = await upsertSession(user.id, req.body);
    } catch (sessionErr) {
      // Table may not exist yet on first deploy; login must still work.
      console.warn('Device session skipped:', sessionErr.message);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        ...(session
          ? { device_id: session.device_id, sid: session.id }
          : req.body.device_id
            ? { device_id: String(req.body.device_id) }
            : {}),
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      device_id: session?.device_id || req.body.device_id || null,
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    return success(res, {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) throw new AppError('User not found', 401);

    const match = await bcrypt.compare(current_password, user.password);
    if (!match) throw new AppError('Current password is incorrect', 400);

    const hashed = await bcrypt.hash(new_password, 12);
    await user.update({ password: hashed });

    return success(res, { changed: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

const verifyPasswordValidators = [
  body('password').notEmpty().withMessage('Password is required'),
];

const verifyPassword = async (req, res, next) => {
  try {
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) throw new AppError('User not found', 401);
    const match = await bcrypt.compare(String(req.body.password || ''), user.password);
    if (!match) throw new AppError('Password is incorrect', 400);
    return success(res, { verified: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  me,
  changePassword,
  verifyPassword,
  loginValidators,
  changePasswordValidators,
  verifyPasswordValidators,
};
