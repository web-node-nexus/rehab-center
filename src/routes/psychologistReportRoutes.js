const express = require('express');
const {
  getPsychologistReport,
  upsertPsychologistReport,
} = require('../controllers/psychologistReportController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('psychologistReport'));

router.get('/students/:studentId/psychologist-report', getPsychologistReport);
router.put('/students/:studentId/psychologist-report', upsertPsychologistReport);

module.exports = router;
