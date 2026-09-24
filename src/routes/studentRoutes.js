const express = require('express');
const {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  dischargeStudent,
} = require('../controllers/studentController');
const { exportStudentPdf } = require('../controllers/exportController');
const {
  listStudentPayments,
  createPayment,
} = require('../controllers/paymentController');
const {
  listFamilyMeetings,
  createFamilyMeeting,
} = require('../controllers/familyMeetingController');
const {
  listMonthlyPhotos,
  createMonthlyPhoto,
} = require('../controllers/monthlyPhotoController');
const { listPickups, createPickup } = require('../controllers/pickupController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission, requireAny, requireRoles } = require('../middlewares/authorize');
const {
  uploadStudentWithReports,
  uploadDischargeImage,
  uploadReceiptImage,
  uploadMonthlyPhoto,
} = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

// HARD role gate — staff/doctor/psych/admin can always list + view students
router.get(
  '/',
  requireRoles('admin', 'staff', 'doctor', 'psychologist'),
  listStudents
);
router.get('/:studentId/payments', requireRoles('admin'), listStudentPayments);
router.post(
  '/:studentId/payments',
  requireRoles('admin'),
  uploadReceiptImage,
  createPayment
);
router.get('/:studentId/family-meetings', requirePermission('familyMeetings'), listFamilyMeetings);
router.post(
  '/:studentId/family-meetings',
  requirePermission('familyMeetings'),
  createFamilyMeeting
);
router.get('/:studentId/monthly-photos', requirePermission('monthlyPhotos'), listMonthlyPhotos);
router.post(
  '/:studentId/monthly-photos',
  requirePermission('monthlyPhotos'),
  uploadMonthlyPhoto,
  createMonthlyPhoto
);
router.get('/:studentId/pickups', requirePermission('pickups'), listPickups);
router.post('/:studentId/pickups', requirePermission('pickups'), createPickup);
router.get('/:id/export-pdf', requirePermission('students.manage'), exportStudentPdf);
router.get(
  '/:id',
  requireRoles('admin', 'staff', 'doctor', 'psychologist'),
  getStudent
);
// Admin full manage OR staff admit
router.post(
  '/',
  requireAny('students.manage', 'students.admit'),
  uploadStudentWithReports,
  createStudent
);
router.post(
  '/:id/discharge',
  requireAny('students.manage', 'students.admit'),
  uploadDischargeImage,
  dischargeStudent
);
// Edit existing student — admin only (staff may admit + discharge, not edit)
router.put(
  '/:id',
  requirePermission('students.manage'),
  uploadStudentWithReports,
  updateStudent
);
router.delete('/:id', requirePermission('students.manage'), deleteStudent);

module.exports = router;
