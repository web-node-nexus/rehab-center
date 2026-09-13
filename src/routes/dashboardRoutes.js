const express = require('express');
const { getStats, getReminders } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/stats', authenticate, getStats);
router.get('/reminders', authenticate, getReminders);

module.exports = router;
