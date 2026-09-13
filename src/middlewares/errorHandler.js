const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, _next) => {
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the allowed limit'
        : err.message;
    return res.status(400).json({ success: false, message });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors?.[0]?.message || err.message;
    return res.status(400).json({ success: false, message });
  }

  const status = err.statusCode || 500;
  const message =
    err.isOperational || status < 500
      ? err.message
      : 'Internal server error';

  if (process.env.NODE_ENV === 'development' && status >= 500) {
    console.error(err);
  }

  return res.status(status).json({ success: false, message });
};

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  return next();
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, validate, notFound };
