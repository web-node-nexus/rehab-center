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

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Rehab Center API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', familyMeetingRoutes);
app.use('/api', monthlyPhotoRoutes);
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
    await sequelize.sync({ alter: env.nodeEnv === 'development' });
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
