const AppError = require('../utils/AppError');
const { can, DENIED_MESSAGE, normalizeRole } = require('../utils/access');

/**
 * Resolve role from the request — JWT first (always reliable), then DB user.
 * Never trust a single Sequelize getter alone.
 */
const resolveRole = (reqOrUser) => {
  // Called as resolveRole(req)
  if (reqOrUser && reqOrUser.user) {
    const req = reqOrUser;
    const fromJwt = req.jwtRole;
    const user = req.user;
    let fromDb = '';
    try {
      if (user) {
        if (typeof user.get === 'function') fromDb = user.get('role');
        if (!fromDb) fromDb = user.role;
        if (!fromDb && user.dataValues) fromDb = user.dataValues.role;
        if (!fromDb && typeof user.toJSON === 'function') fromDb = user.toJSON().role;
      }
    } catch (_) {
      /* ignore */
    }
    return normalizeRole(fromJwt || fromDb || '');
  }

  // Called as resolveRole(user)
  const user = reqOrUser;
  if (!user) return '';
  try {
    let raw = '';
    if (typeof user.get === 'function') raw = user.get('role');
    if (!raw) raw = user.role;
    if (!raw && user.dataValues) raw = user.dataValues.role;
    return normalizeRole(raw || '');
  } catch (_) {
    return normalizeRole(user.role || '');
  }
};

/** Hard allow-lists — cannot be broken by stale ROLE_PERMISSIONS */
const ROLE_ALLOW = {
  staff: new Set([
    'inquiries',
    'students',
    'student.basic',
    'students.admit',
    'doctorReport',
    'btReport',
    'settings',
  ]),
  doctor: new Set([
    'home',
    'students',
    'student.basic',
    'student.medical',
    'doctorReport',
    'btReport',
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

  // Explicit hard gates (do not remove)
  if (
    (p === 'students' || p === 'student.basic') &&
    (r === 'staff' || r === 'doctor' || r === 'psychologist')
  ) {
    return true;
  }
  if (p === 'students.admit' && r === 'staff') return true;
  if (p === 'inquiries' && r === 'staff') return true;
  if (p === 'doctorReport' && (r === 'doctor' || r === 'staff')) return true;
  if (p === 'btReport' && (r === 'staff' || r === 'doctor')) return true;
  if (p === 'psychologistReport' && r === 'psychologist') return true;

  if (ROLE_ALLOW[r]?.has(p)) return true;
  return can(r, p);
};

const requirePermission = (permission) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const role = resolveRole(req);
    if (!hasPermission(role, permission)) {
      // Include role in message so phone/logs show what server saw
      throw new AppError(`${DENIED_MESSAGE} [${role || 'no-role'}]`, 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requireAny = (...permissions) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const role = resolveRole(req);
    if (permissions.some((permission) => hasPermission(role, permission))) {
      return next();
    }
    throw new AppError(`${DENIED_MESSAGE} [${role || 'no-role'}]`, 403);
  } catch (err) {
    next(err);
  }
};

/** Role-based gate that ignores permission strings entirely */
const requireRoles = (...roles) => (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const role = resolveRole(req);
    const allowed = roles.map((r) => normalizeRole(r));
    if (role === 'admin' || allowed.includes(role)) return next();
    throw new AppError(`${DENIED_MESSAGE} [${role || 'no-role'}]`, 403);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requirePermission,
  requireAny,
  requireRoles,
  hasPermission,
  resolveRole,
};
