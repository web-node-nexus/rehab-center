const express = require('express');
const {
  listAllMonthlyPhotos,
  listMonthlyPhotos,
  createMonthlyPhoto,
  updateMonthlyPhoto,
  deleteMonthlyPhoto,
} = require('../controllers/monthlyPhotoController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');
const { uploadMonthlyPhoto } = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('monthlyPhotos'));

router.get('/monthly-photos', listAllMonthlyPhotos);
router.get('/students/:studentId/monthly-photos', listMonthlyPhotos);
router.post('/students/:studentId/monthly-photos', uploadMonthlyPhoto, createMonthlyPhoto);
router.put('/monthly-photos/:id', uploadMonthlyPhoto, updateMonthlyPhoto);
router.delete('/monthly-photos/:id', deleteMonthlyPhoto);

module.exports = router;
