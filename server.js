const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./src/config/env');
const sequelize = require('./src/config/db');
require('./src/models');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const initialReportRoutes = require('./src/routes/initialReportRoutes');
const monthlyRecordRoutes = require('./src/routes/monthlyRecordRoutes');
const doctorVisitRoutes = require('./src/routes/doctorVisitRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const familyMeetingRoutes = require('./src/routes/familyMeetingRoutes');
const monthlyPhotoRoutes = require('./src/routes/monthlyPhotoRoutes');
const inquiryRoutes = require('./src/routes/inquiryRoutes');
const pickupRoutes = require('./src/routes/pickupRoutes');
const psychologistReportRoutes = require('./src/routes/psychologistReportRoutes');
const cashbookRoutes = require('./src/routes/cashbookRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  let accessCheck = {};
  try {
    const access = require('./src/utils/access');
    const authz = require('./src/middlewares/authorize');
    accessCheck = {
      accessVersion: 'roles-v5-jwt-hard-2026-09-18',
      cwd: process.cwd(),
      staffStudents: access.can('staff', 'students'),
      staffInquiries: access.can('staff', 'inquiries'),
      hasPermStaffStudents: authz.hasPermission('staff', 'students'),
      hasPermStaffInquiries: authz.hasPermission('staff', 'inquiries'),
      doctorStudents: access.can('doctor', 'students'),
      psychStudents: access.can('psychologist', 'students'),
    };
  } catch (err) {
    accessCheck = { accessError: err.message };
  }
  res.json({
    success: true,
    message: 'Rehab Center API is running',
    ...accessCheck,
  });
});

// Auth debug — shows exactly what role the server resolves for this token
app.get('/api/debug/whoami', require('./src/middlewares/auth').authenticate, (req, res) => {
  const { resolveRole, hasPermission } = require('./src/middlewares/authorize');
  const role = resolveRole(req);
  res.json({
    success: true,
    data: {
      id: req.user?.id,
      email: req.user?.email,
      dbRole: req.user?.role,
      jwtRole: req.jwtRole,
      resolvedRole: role,
      canStudents: hasPermission(role, 'students'),
      canInquiries: hasPermission(role, 'inquiries'),
      accessVersion: 'roles-v5-jwt-hard-2026-09-18',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', familyMeetingRoutes);
app.use('/api', monthlyPhotoRoutes);
app.use('/api', inquiryRoutes);
app.use('/api', pickupRoutes);
app.use('/api', psychologistReportRoutes);
app.use('/api', cashbookRoutes);
app.use('/api', adminRoutes);
app.use('/api', initialReportRoutes);
app.use('/api', monthlyRecordRoutes);
app.use('/api', doctorVisitRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.authenticate();
    // Live/production: never alter or recreate tables on boot (protects existing data).
    // Local/dev only: create missing tables; still no force/drop.
    if (env.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
    }
    app.listen(env.port, () => {
      console.log(`Rehab Center API listening on ${env.host}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
