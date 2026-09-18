const express = require('express');
const { listPickups, createPickup } = require('../controllers/pickupController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');

const router = express.Router();

router.get(
  '/students/:studentId/pickups',
  authenticate,
  requirePermission('pickups'),
  listPickups
);
router.post(
  '/students/:studentId/pickups',
  authenticate,
  requirePermission('pickups'),
  createPickup
);

module.exports = router;
