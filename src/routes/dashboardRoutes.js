const express = require('express');
const { getStats, getReminders } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');

const router = express.Router();

router.get('/stats', authenticate, requirePermission('home'), getStats);
router.get('/reminders', authenticate, requirePermission('home'), getReminders);

module.exports = router;
