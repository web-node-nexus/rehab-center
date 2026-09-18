const AppError = require('../utils/AppError');
const { can, DENIED_MESSAGE, normalizeRole } = require('../utils/access');

const resolveRole = (user) => {
  if (!user) return '';
  return normalizeRole(user.role || user.dataValues?.role || '');
};

const requirePermission = (permission) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const role = resolveRole(req.user);
    if (!can(role, permission)) {
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
    const role = resolveRole(req.user);
    if (permissions.some((permission) => can(role, permission))) {
      return next();
    }
    throw new AppError(DENIED_MESSAGE, 403);
  } catch (err) {
    next(err);
  }
};

module.exports = { requirePermission, requireAny };
