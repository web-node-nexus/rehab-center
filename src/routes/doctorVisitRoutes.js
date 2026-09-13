const express = require('express');
const {
  listDoctorVisits,
  createDoctorVisit,
  updateDoctorVisit,
  deleteDoctorVisit,
} = require('../controllers/doctorVisitController');
const { authenticate } = require('../middlewares/auth');
const { uploadPrescriptionFiles } = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/students/:studentId/doctor-visits', listDoctorVisits);
router.post('/students/:studentId/doctor-visits', uploadPrescriptionFiles, createDoctorVisit);
router.put('/doctor-visits/:id', uploadPrescriptionFiles, updateDoctorVisit);
router.delete('/doctor-visits/:id', deleteDoctorVisit);

module.exports = router;
