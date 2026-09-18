const { Op } = require('sequelize');
const { TeamMember, User } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, success, toPublicUrl } = require('../utils/helpers');

const mapMember = (row) => {
  const data = row.toJSON ? row.toJSON() : { ...row };
  data.photo = toPublicUrl(data.photo);
  return data;
};

const listTeamMembers = async (req, res, next) => {
  try {
    const { search, status, duty } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};
    if (status && ['active', 'inactive'].includes(String(status))) {
      where.status = status;
    }
    if (duty && String(duty).trim()) {
      where.duty = String(duty).trim();
    }
    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { mobile: { [Op.like]: q } },
        { staff_id: { [Op.like]: q } },
        { qualification: { [Op.like]: q } },
        { duty: { [Op.like]: q } },
        { duty_other: { [Op.like]: q } },
      ];
    }

    const { rows, count } = await TeamMember.findAndCountAll({
      where,
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
      order: [
        ['status', 'ASC'],
        ['name', 'ASC'],
      ],
      limit,
      offset,
    });

    return success(res, rows.map(mapMember), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const getTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findByPk(req.params.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    if (!member) throw new AppError('Team member not found', 404);
    return success(res, mapMember(member));
  } catch (err) {
    next(err);
  }
};

const createTeamMember = async (req, res, next) => {
  try {
    const body = req.body;
    const name = String(body.name || '').trim();
    if (name.length < 2) throw new AppError('Name is required', 400);

    const photo = req.file ? `uploads/team/${req.file.filename}` : null;
    const duty = body.duty || null;
    const member = await TeamMember.create({
      photo,
      name,
      mobile: body.mobile || null,
      date_of_birth: body.date_of_birth || null,
      sober_since: body.sober_since || null,
      qualification: body.qualification || null,
      staff_id: body.staff_id || null,
      duty,
      duty_other: duty === 'Other' ? body.duty_other || null : null,
      status: ['active', 'inactive'].includes(body.status) ? body.status : 'active',
      added_by: req.user?.id || null,
    });

    return success(res, mapMember(member), null, 201);
  } catch (err) {
    next(err);
  }
};

const updateTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) throw new AppError('Team member not found', 404);

    const body = req.body;
    const updates = {};
    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (name.length < 2) throw new AppError('Name is required', 400);
      updates.name = name;
    }
    ['mobile', 'date_of_birth', 'sober_since', 'qualification', 'staff_id', 'duty', 'duty_other', 'status'].forEach(
      (key) => {
        if (body[key] !== undefined) updates[key] = body[key] || null;
      }
    );
    if (updates.status && !['active', 'inactive'].includes(updates.status)) {
      updates.status = member.status;
    }
    if (updates.duty && updates.duty !== 'Other') {
      updates.duty_other = null;
    }
    if (req.file) {
      updates.photo = `uploads/team/${req.file.filename}`;
    }

    await member.update(updates);
    return success(res, mapMember(member));
  } catch (err) {
    next(err);
  }
};

const deleteTeamMember = async (req, res, next) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) throw new AppError('Team member not found', 404);
    await member.destroy();
    return success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
