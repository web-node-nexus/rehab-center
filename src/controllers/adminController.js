const crypto = require('crypto');
const { Op } = require('sequelize');
const { DeviceSession, User } = require('../models');
const AppError = require('../utils/AppError');
const { success } = require('../utils/helpers');

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const parseOptionalTextSafe = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text.slice(0, 160) : null;
};

const upsertSession = async (userId, body = {}) => {
  const deviceId = String(body.device_id || '').trim() || crypto.randomUUID();
  const now = new Date();
  const [session] = await DeviceSession.findOrCreate({
    where: { user_id: userId, device_id: deviceId },
    defaults: {
      user_id: userId,
      device_id: deviceId,
      device_name: parseOptionalTextSafe(body.device_name),
      platform: parseOptionalTextSafe(body.platform),
      app_version: parseOptionalTextSafe(body.app_version),
      last_seen_at: now,
      is_active: true,
    },
  });

  await session.update({
    device_name: parseOptionalTextSafe(body.device_name) || session.device_name,
    platform: parseOptionalTextSafe(body.platform) || session.platform,
    app_version: parseOptionalTextSafe(body.app_version) || session.app_version,
    last_seen_at: now,
    is_active: true,
  });

  return session;
};

const touchSession = async (userId, deviceId) => {
  if (!userId || !deviceId) return;
  await DeviceSession.update(
    { last_seen_at: new Date(), is_active: true },
    { where: { user_id: userId, device_id: deviceId } }
  );
};

const logoutSession = async (req, res, next) => {
  try {
    const deviceId = String(req.body.device_id || req.headers['x-device-id'] || '').trim();
    if (deviceId) {
      await DeviceSession.update(
        { is_active: false, last_seen_at: new Date() },
        { where: { user_id: req.user.id, device_id: deviceId } }
      );
    }
    return success(res, { logged_out: true });
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new AppError('You are not authorized for this action', 403);
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'created_at', 'updated_at'],
      order: [['id', 'ASC']],
    });
    return success(res, users);
  } catch (err) {
    next(err);
  }
};

const adminSetPassword = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new AppError('You are not authorized for this action', 403);
    const bcrypt = require('bcryptjs');
    const user = await User.scope('withPassword').findByPk(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin' && user.id !== req.user.id) {
      throw new AppError('Cannot reset another admin password here', 403);
    }
    const password = String(req.body.password || '');
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    const hashed = await bcrypt.hash(password, 12);
    await user.update({ password: hashed });
    return success(res, {
      changed: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

const listSessions = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new AppError('You are not authorized for this action', 403);
    const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const rows = await DeviceSession.findAll({
      where: {
        is_active: true,
        last_seen_at: { [Op.gte]: since },
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['last_seen_at', 'DESC']],
    });

    const uniqueDevices = new Set(rows.map((r) => r.device_id));
    const byRole = {};
    rows.forEach((r) => {
      const role = r.user?.role || 'unknown';
      byRole[role] = (byRole[role] || 0) + 1;
    });

    return success(res, rows, {
      activeDevices: uniqueDevices.size,
      activeSessions: rows.length,
      byRole,
    });
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new AppError('You are not authorized for this action', 403);
    const row = await DeviceSession.findByPk(req.params.id);
    if (!row) throw new AppError('Session not found', 404);
    await row.update({ is_active: false });
    return success(res, { revoked: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upsertSession,
  touchSession,
  logoutSession,
  listUsers,
  adminSetPassword,
  listSessions,
  revokeSession,
};
