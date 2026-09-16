const express = require('express');
const {
  listStudentPayments,
  listAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');
const { uploadReceiptImage } = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('payments'));

router.get('/payments', listAllPayments);
router.get('/students/:studentId/payments', listStudentPayments);
router.post('/students/:studentId/payments', uploadReceiptImage, createPayment);
router.put('/payments/:id', uploadReceiptImage, updatePayment);
router.delete('/payments/:id', deletePayment);

module.exports = router;
