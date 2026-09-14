const express = require('express');
const {
  listMonthlyPhotos,
  createMonthlyPhoto,
  updateMonthlyPhoto,
  deleteMonthlyPhoto,
} = require('../controllers/monthlyPhotoController');
const { authenticate } = require('../middlewares/auth');
const { uploadMonthlyPhoto } = require('../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.get('/students/:studentId/monthly-photos', listMonthlyPhotos);
router.post('/students/:studentId/monthly-photos', uploadMonthlyPhoto, createMonthlyPhoto);
router.put('/monthly-photos/:id', uploadMonthlyPhoto, updateMonthlyPhoto);
router.delete('/monthly-photos/:id', deleteMonthlyPhoto);

module.exports = router;
