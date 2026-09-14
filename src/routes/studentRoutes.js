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
const {
  uploadStudentWithReports,
  uploadDischargeImage,
  uploadReceiptImage,
  uploadMonthlyPhoto,
} = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/', listStudents);
router.get('/:studentId/payments', listStudentPayments);
router.post('/:studentId/payments', uploadReceiptImage, createPayment);
router.get('/:studentId/family-meetings', listFamilyMeetings);
router.post('/:studentId/family-meetings', createFamilyMeeting);
router.get('/:studentId/monthly-photos', listMonthlyPhotos);
router.post('/:studentId/monthly-photos', uploadMonthlyPhoto, createMonthlyPhoto);
router.get('/:studentId/pickups', listPickups);
router.post('/:studentId/pickups', createPickup);
router.get('/:id/export-pdf', exportStudentPdf);
router.get('/:id', getStudent);
router.post('/', uploadStudentWithReports, createStudent);
router.post('/:id/discharge', uploadDischargeImage, dischargeStudent);
router.put('/:id', uploadStudentWithReports, updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
