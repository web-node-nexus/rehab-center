const express = require('express');
const { login, me, loginValidators } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/errorHandler');

const router = express.Router();

router.post('/login', loginValidators, validate, login);
router.get('/me', authenticate, me);

module.exports = router;
