const express = require('express');
const {
  login,
  me,
  changePassword,
  verifyPassword,
  loginValidators,
  changePasswordValidators,
  verifyPasswordValidators,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/errorHandler');

const router = express.Router();

router.post('/login', loginValidators, validate, login);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePasswordValidators, validate, changePassword);
router.post('/verify-password', authenticate, verifyPasswordValidators, validate, verifyPassword);

module.exports = router;
