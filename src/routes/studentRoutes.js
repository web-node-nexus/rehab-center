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
const { requirePermission } = require('../middlewares/authorize');
const {
  uploadStudentWithReports,
  uploadDischargeImage,
  uploadReceiptImage,
  uploadMonthlyPhoto,
} = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('students'), listStudents);
router.get('/:studentId/payments', requirePermission('payments'), listStudentPayments);
router.post(
  '/:studentId/payments',
  requirePermission('payments'),
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
router.get('/:id', requirePermission('students'), getStudent);
router.post(
  '/',
  requirePermission('students.manage'),
  uploadStudentWithReports,
  createStudent
);
router.post(
  '/:id/discharge',
  requirePermission('students.manage'),
  uploadDischargeImage,
  dischargeStudent
);
router.put(
  '/:id',
  requirePermission('students.manage'),
  uploadStudentWithReports,
  updateStudent
);
router.delete('/:id', requirePermission('students.manage'), deleteStudent);

module.exports = router;
