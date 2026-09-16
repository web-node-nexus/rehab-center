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

router.use(authenticate);
router.use(requirePermission('cashbook'));

router.get('/cash-entries', listEntries);
router.post('/cash-entries', createEntry);
router.put('/cash-entries/:id', updateEntry);
router.delete('/cash-entries/:id', deleteEntry);

module.exports = router;
