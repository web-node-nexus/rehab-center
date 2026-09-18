const express = require('express');
const {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} = require('../controllers/cashbookController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');

const router = express.Router();

router.get('/cash-entries', authenticate, requirePermission('cashbook'), listEntries);
router.post('/cash-entries', authenticate, requirePermission('cashbook'), createEntry);
router.put('/cash-entries/:id', authenticate, requirePermission('cashbook'), updateEntry);
router.delete('/cash-entries/:id', authenticate, requirePermission('cashbook'), deleteEntry);

module.exports = router;
