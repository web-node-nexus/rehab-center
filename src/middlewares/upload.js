const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AppError = require('../utils/AppError');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const makeStorage = (subdir) => {
  const dest = path.join(__dirname, '../../uploads', subdir);
  ensureDir(dest);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${unique}${ext}`);
    },
  });
};

const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new AppError('Only JPG, PNG, or WEBP images are allowed', 400), false);
};

const pdfFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  return cb(new AppError('Only PDF files are allowed', 400), false);
};

const documentFilter = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new AppError('Only PDF, JPG, PNG, or WEBP files are allowed', 400), false);
};

const uploadProfileImage = multer({
  storage: makeStorage('profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('profile_image');

const uploadReportPdf = multer({
  storage: makeStorage('reports'),
  fileFilter: documentFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('pdf_file');

const uploadMonthlyPdf = multer({
  storage: makeStorage('reports'),
  fileFilter: pdfFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('pdf_report');

const uploadPrescriptionPdf = multer({
  storage: makeStorage('prescriptions'),
  fileFilter: pdfFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('prescription_pdf');

const uploadPrescriptionFiles = multer({
  storage: makeStorage('prescriptions'),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'prescription_pdf') {
      return pdfFilter(req, file, cb);
    }
    if (file.fieldname === 'checkup_report') {
      return documentFilter(req, file, cb);
    }
    if (file.fieldname === 'prescription_image') return imageFilter(req, file, cb);
    return cb(new AppError('Unexpected file field', 400), false);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
  { name: 'prescription_pdf', maxCount: 1 },
  { name: 'prescription_image', maxCount: 1 },
  { name: 'checkup_report', maxCount: 1 },
]);

const uploadMonthlyPhoto = multer({
  storage: makeStorage('photos'),
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('photo');

const uploadReceiptImage = multer({
  storage: makeStorage('receipts'),
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single('receipt_image');

const uploadDischargeImage = multer({
  storage: makeStorage('profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('discharge_image');

const uploadTeamPhoto = multer({
  storage: makeStorage('team'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo');

const uploadStudentWithReports = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let sub = 'reports';
      if (file.fieldname === 'profile_image' || file.fieldname === 'discharge_image') {
        sub = 'profiles';
      }
      if (file.fieldname === 'aadhar_image' || file.fieldname === 'family_aadhar_image') {
        sub = 'aadhar';
      }
      const dest = path.join(__dirname, '../../uploads', sub);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${unique}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      ['profile_image', 'aadhar_image', 'family_aadhar_image', 'discharge_image'].includes(
        file.fieldname
      )
    ) {
      return imageFilter(req, file, cb);
    }
    if (file.fieldname === 'initial_reports') return documentFilter(req, file, cb);
    return cb(new AppError('Unexpected file field', 400), false);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'aadhar_image', maxCount: 1 },
  { name: 'family_aadhar_image', maxCount: 1 },
  { name: 'initial_reports', maxCount: 10 },
]);

module.exports = {
  uploadProfileImage,
  uploadReportPdf,
  uploadMonthlyPdf,
  uploadPrescriptionPdf,
  uploadPrescriptionFiles,
  uploadDischargeImage,
  uploadTeamPhoto,
  uploadStudentWithReports,
  uploadMonthlyPhoto,
  uploadReceiptImage,
};
