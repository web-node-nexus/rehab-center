const express = require('express');
const {
  listInquiries,
  createInquiry,
  updateInquiry,
  deleteInquiry,
} = require('../controllers/inquiryController');
const { authenticate } = require('../middlewares/auth');
const { requireRoles } = require('../middlewares/authorize');

const router = express.Router();

const staffOrAdmin = [authenticate, requireRoles('admin', 'staff')];

router.get('/inquiries', ...staffOrAdmin, listInquiries);
router.post('/inquiries', ...staffOrAdmin, createInquiry);
router.put('/inquiries/:id', ...staffOrAdmin, updateInquiry);
router.delete('/inquiries/:id', ...staffOrAdmin, deleteInquiry);

module.exports = router;
