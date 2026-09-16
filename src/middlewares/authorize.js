const AppError = require('../utils/AppError');
const { can, DENIED_MESSAGE } = require('../utils/access');

const requirePermission = (permission) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    if (!can(req.user.role, permission)) {
      throw new AppError(DENIED_MESSAGE, 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requireAny = (...permissions) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    if (permissions.some((permission) => can(req.user.role, permission))) {
      return next();
    }
    throw new AppError(DENIED_MESSAGE, 403);
  } catch (err) {
    next(err);
  }
};

module.exports = { requirePermission, requireAny };
