const express = require('express');
const {
  listPickups,
  createPickup,
  updatePickup,
  deletePickup,
} = require('../controllers/pickupController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/students/:studentId/pickups', listPickups);
router.post('/students/:studentId/pickups', createPickup);
router.put('/pickups/:id', updatePickup);
router.delete('/pickups/:id', deletePickup);

module.exports = router;
