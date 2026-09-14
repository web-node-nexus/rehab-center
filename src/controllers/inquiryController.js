const { Op } = require('sequelize');
const { Inquiry, User } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, success } = require('../utils/helpers');

const mapInquiry = (row) => (row.toJSON ? row.toJSON() : { ...row });

const listInquiries = async (req, res, next) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};
    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { address: { [Op.like]: q } },
      ];
    }

    const { rows, count } = await Inquiry.findAndCountAll({
      where,
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
      order: [['inquiry_date', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    return success(res, rows.map(mapInquiry), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const createInquiry = async (req, res, next) => {
  try {
    if (!req.body.name || !String(req.body.name).trim()) {
      throw new AppError('Name is required', 400);
    }
    if (!req.body.inquiry_date) {
      throw new AppError('Inquiry date is required', 400);
    }

    const inquiry = await Inquiry.create({
      name: String(req.body.name).trim(),
      address: req.body.address || null,
      phone: req.body.phone || null,
      inquiry_date: req.body.inquiry_date,
      notes: req.body.notes || null,
      added_by: req.user.id,
    });

    const full = await Inquiry.findByPk(inquiry.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapInquiry(full), null, 201);
  } catch (err) {
    next(err);
  }
};

const updateInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) throw new AppError('Inquiry not found', 404);

    const updates = { ...req.body };
    delete updates.added_by;
    if (updates.name) updates.name = String(updates.name).trim();
    await inquiry.update(updates);

    const full = await Inquiry.findByPk(inquiry.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapInquiry(full));
  } catch (err) {
    next(err);
  }
};

const deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByPk(req.params.id);
    if (!inquiry) throw new AppError('Inquiry not found', 404);
    await inquiry.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listInquiries,
  createInquiry,
  updateInquiry,
  deleteInquiry,
};
