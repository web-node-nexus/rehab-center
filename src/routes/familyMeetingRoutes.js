const express = require('express');
const {
  listFamilyMeetings,
  createFamilyMeeting,
} = require('../controllers/familyMeetingController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');

const router = express.Router();

router.get(
  '/students/:studentId/family-meetings',
  authenticate,
  requirePermission('familyMeetings'),
  listFamilyMeetings
);
router.post(
  '/students/:studentId/family-meetings',
  authenticate,
  requirePermission('familyMeetings'),
  createFamilyMeeting
);

module.exports = router;
