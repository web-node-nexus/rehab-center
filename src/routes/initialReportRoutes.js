const express = require('express');
const {
  listInitialReports,
  createInitialReport,
  deleteInitialReport,
} = require('../controllers/initialReportController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');
const { uploadReportPdf } = require('../middlewares/upload');

const router = express.Router();

router.get(
  '/students/:studentId/initial-reports',
  authenticate,
  requirePermission('btReport'),
  listInitialReports
);
router.post(
  '/students/:studentId/initial-reports',
  authenticate,
  requirePermission('btReport'),
  uploadReportPdf,
  createInitialReport
);
router.delete(
  '/initial-reports/:id',
  authenticate,
  requirePermission('btReport'),
  deleteInitialReport
);

module.exports = router;
