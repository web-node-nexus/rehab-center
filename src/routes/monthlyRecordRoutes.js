const express = require('express');
const {
  listMonthlyRecords,
  createMonthlyRecord,
  updateMonthlyRecord,
  deleteMonthlyRecord,
} = require('../controllers/monthlyRecordController');
const { authenticate } = require('../middlewares/auth');
const { uploadMonthlyPdf } = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/students/:studentId/monthly-records', listMonthlyRecords);
router.post('/students/:studentId/monthly-records', uploadMonthlyPdf, createMonthlyRecord);
router.put('/monthly-records/:id', uploadMonthlyPdf, updateMonthlyRecord);
router.delete('/monthly-records/:id', deleteMonthlyRecord);

module.exports = router;
