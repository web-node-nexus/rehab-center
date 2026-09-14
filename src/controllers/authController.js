const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { User } = require('../models');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { success } = require('../utils/helpers');

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
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError('Invalid email or password', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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

module.exports = {
  login,
  me,
  changePassword,
  loginValidators,
  changePasswordValidators,
};
