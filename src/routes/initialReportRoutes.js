const express = require('express');
const {
  listInitialReports,
  createInitialReport,
  deleteInitialReport,
} = require('../controllers/initialReportController');
const { authenticate } = require('../middlewares/auth');
const { uploadReportPdf } = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/students/:studentId/initial-reports', listInitialReports);
router.post('/students/:studentId/initial-reports', uploadReportPdf, createInitialReport);
router.delete('/initial-reports/:id', deleteInitialReport);

module.exports = router;
