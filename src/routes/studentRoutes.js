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
const { authenticate } = require('../middlewares/auth');
const {
  uploadStudentWithReports,
  uploadProfileImage,
  uploadDischargeImage,
} = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/', listStudents);
router.get('/:id/export-pdf', exportStudentPdf);
router.get('/:id', getStudent);
router.post('/', uploadStudentWithReports, createStudent);
router.post('/:id/discharge', uploadDischargeImage, dischargeStudent);
router.put('/:id', uploadProfileImage, updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
