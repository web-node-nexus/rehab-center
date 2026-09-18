const express = require('express');
const {
  listMonthlyRecords,
  createMonthlyRecord,
  updateMonthlyRecord,
  deleteMonthlyRecord,
} = require('../controllers/monthlyRecordController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');
const { uploadMonthlyPdf } = require('../middlewares/upload');

const router = express.Router();

router.get(
  '/students/:studentId/monthly-records',
  authenticate,
  requirePermission('monthlyTests'),
  listMonthlyRecords
);
router.post(
  '/students/:studentId/monthly-records',
  authenticate,
  requirePermission('monthlyTests'),
  uploadMonthlyPdf,
  createMonthlyRecord
);
router.put(
  '/monthly-records/:id',
  authenticate,
  requirePermission('monthlyTests'),
  uploadMonthlyPdf,
  updateMonthlyRecord
);
router.delete(
  '/monthly-records/:id',
  authenticate,
  requirePermission('monthlyTests'),
  deleteMonthlyRecord
);

module.exports = router;
