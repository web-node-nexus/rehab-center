const express = require('express');
const { body } = require('express-validator');
const {
  logoutSession,
  listUsers,
  ensureRoleUsers,
  adminSetPassword,
  listSessions,
  revokeSession,
} = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/errorHandler');

const router = express.Router();

router.use(authenticate);

router.post('/auth/logout', logoutSession);

router.get('/admin/users', listUsers);
router.post('/admin/ensure-role-users', ensureRoleUsers);
router.put(
  '/admin/users/:id/password',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  adminSetPassword
);
router.get('/admin/sessions', listSessions);
router.delete('/admin/sessions/:id', revokeSession);

module.exports = router;
