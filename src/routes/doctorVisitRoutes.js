const express = require('express');
const {
  listDoctorVisits,
  createDoctorVisit,
  updateDoctorVisit,
  deleteDoctorVisit,
} = require('../controllers/doctorVisitController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');
const { uploadPrescriptionFiles } = require('../middlewares/upload');

const router = express.Router();

router.get(
  '/students/:studentId/doctor-visits',
  authenticate,
  requirePermission('doctorReport'),
  listDoctorVisits
);
router.post(
  '/students/:studentId/doctor-visits',
  authenticate,
  requirePermission('doctorReport'),
  uploadPrescriptionFiles,
  createDoctorVisit
);
router.put(
  '/doctor-visits/:id',
  authenticate,
  requirePermission('doctorReport'),
  uploadPrescriptionFiles,
  updateDoctorVisit
);
router.delete(
  '/doctor-visits/:id',
  authenticate,
  requirePermission('doctorReport'),
  deleteDoctorVisit
);

module.exports = router;
