const express = require('express');
const {
  getPsychologistReport,
  upsertPsychologistReport,
} = require('../controllers/psychologistReportController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');

const router = express.Router();

router.get(
  '/students/:studentId/psychologist-report',
  authenticate,
  requirePermission('psychologistReport'),
  getPsychologistReport
);
router.put(
  '/students/:studentId/psychologist-report',
  authenticate,
  requirePermission('psychologistReport'),
  upsertPsychologistReport
);

module.exports = router;
