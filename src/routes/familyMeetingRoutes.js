const express = require('express');
const {
  listFamilyMeetings,
  createFamilyMeeting,
  updateFamilyMeeting,
  deleteFamilyMeeting,
} = require('../controllers/familyMeetingController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/students/:studentId/family-meetings', listFamilyMeetings);
router.post('/students/:studentId/family-meetings', createFamilyMeeting);
router.put('/family-meetings/:id', updateFamilyMeeting);
router.delete('/family-meetings/:id', deleteFamilyMeeting);

module.exports = router;
