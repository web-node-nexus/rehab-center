const AppError = require('../utils/AppError');
const { can, DENIED_MESSAGE, normalizeRole } = require('../utils/access');

const resolveRole = (user) => {
  if (!user) return '';
  // Sequelize model / plain object / dataValues — all covered
  const raw =
    user.role ??
    user.dataValues?.role ??
    (typeof user.get === 'function' ? user.get('role') : undefined) ??
    '';
  return normalizeRole(raw);
};

/** Absolute allow-lists so a stale ROLE_PERMISSIONS array can never lock staff out */
const ROLE_ALLOW = {
  admin: null, // all
  staff: new Set(['inquiries', 'students', 'student.basic', 'settings']),
  doctor: new Set([
    'home',
    'students',
    'student.basic',
    'student.medical',
    'doctorReport',
    'settings',
  ]),
  psychologist: new Set([
    'home',
    'students',
    'student.basic',
    'psychologistReport',
    'settings',
  ]),
};

const hasPermission = (role, permission) => {
  const r = normalizeRole(role);
  const p = String(permission || '').trim();
  if (!r || !p) return false;
  if (r === 'admin') return true;
  if (ROLE_ALLOW[r]?.has(p)) return true;
  // Fallback to access.js can()
  return can(r, p);
};

const requirePermission = (permission) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const role = resolveRole(req.user);
    if (!hasPermission(role, permission)) {
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
    if (permissions.some((permission) => hasPermission(role, permission))) {
      return next();
    }
    throw new AppError(DENIED_MESSAGE, 403);
  } catch (err) {
    next(err);
  }
};

module.exports = { requirePermission, requireAny, hasPermission, resolveRole };
