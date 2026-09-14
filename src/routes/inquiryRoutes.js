const express = require('express');
const {
  listInquiries,
  createInquiry,
  updateInquiry,
  deleteInquiry,
} = require('../controllers/inquiryController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/inquiries', listInquiries);
router.post('/inquiries', createInquiry);
router.put('/inquiries/:id', updateInquiry);
router.delete('/inquiries/:id', deleteInquiry);

module.exports = router;
