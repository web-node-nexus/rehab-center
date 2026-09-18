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

router.use(authenticate);
// HARD: only admin + staff for enquiry CRUD
router.use(requireRoles('admin', 'staff'));

router.get('/inquiries', listInquiries);
router.post('/inquiries', createInquiry);
router.put('/inquiries/:id', updateInquiry);
router.delete('/inquiries/:id', deleteInquiry);

module.exports = router;
