const express = require('express');
const {
  listMonthlyPhotos,
  listAllMonthlyPhotos,
  createMonthlyPhoto,
} = require('../controllers/monthlyPhotoController');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/authorize');
const { uploadMonthlyPhoto } = require('../middlewares/upload');

const router = express.Router();

router.get('/monthly-photos', authenticate, requirePermission('monthlyPhotos'), listAllMonthlyPhotos);
router.get(
  '/students/:studentId/monthly-photos',
  authenticate,
  requirePermission('monthlyPhotos'),
  listMonthlyPhotos
);
router.post(
  '/students/:studentId/monthly-photos',
  authenticate,
  requirePermission('monthlyPhotos'),
  uploadMonthlyPhoto,
  createMonthlyPhoto
);

module.exports = router;
