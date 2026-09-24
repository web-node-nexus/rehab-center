const express = require('express');
const {
  listStudentPayments,
  listAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/authorize');
const { uploadReceiptImage } = require('../middlewares/upload');

const router = express.Router();

// IMPORTANT: never router.use(requirePermission) here — this router is mounted at /api
// Payments: ADMIN ONLY (view / add / edit / delete)
const adminOnly = [authenticate, requireRoles('admin')];

router.get('/payments', ...adminOnly, listAllPayments);
router.get('/students/:studentId/payments', ...adminOnly, listStudentPayments);
router.post(
  '/students/:studentId/payments',
  ...adminOnly,
  uploadReceiptImage,
  createPayment
);
router.put('/payments/:id', ...adminOnly, uploadReceiptImage, updatePayment);
router.delete('/payments/:id', ...adminOnly, deletePayment);

module.exports = router;
