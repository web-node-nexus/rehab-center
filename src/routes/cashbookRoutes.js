const express = require('express');
const {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} = require('../controllers/cashbookController');
const { authenticate } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/authorize');

const router = express.Router();

// Cashbook is money — admin only
const adminOnly = [authenticate, requireRoles('admin')];

router.get('/cash-entries', ...adminOnly, listEntries);
router.post('/cash-entries', ...adminOnly, createEntry);
router.put('/cash-entries/:id', ...adminOnly, updateEntry);
router.delete('/cash-entries/:id', ...adminOnly, deleteEntry);

module.exports = router;
