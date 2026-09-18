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

// IMPORTANT: never router.use(requirePermission) here — this router is mounted at /api
// and would block ALL /api/* traffic (students, inquiries, etc.) for non-admin roles.

router.get('/payments', authenticate, requirePermission('payments'), listAllPayments);
router.get(
  '/students/:studentId/payments',
  authenticate,
  requirePermission('payments'),
  listStudentPayments
);
router.post(
  '/students/:studentId/payments',
  authenticate,
  requirePermission('payments'),
  uploadReceiptImage,
  createPayment
);
router.put(
  '/payments/:id',
  authenticate,
  requirePermission('payments'),
  uploadReceiptImage,
  updatePayment
);
router.delete('/payments/:id', authenticate, requirePermission('payments'), deletePayment);

module.exports = router;
