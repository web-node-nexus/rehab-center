const { MonthlyPhoto, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, parsePagination, success } = require('../utils/helpers');

const mapPhoto = (row) => {
  const data = row.toJSON ? row.toJSON() : { ...row };
  data.photo = toPublicUrl(data.photo);
  if (data.student) {
    data.student = {
      ...data.student,
      profile_image: toPublicUrl(data.student.profile_image),
    };
  }
  return data;
};

const listAllMonthlyPhotos = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.month) where.month = parseInt(req.query.month, 10);
    if (req.query.year) where.year = parseInt(req.query.year, 10);

    const { page, limit, offset } = parsePagination({ ...req.query, limit: req.query.limit || 50 });
    const { rows, count } = await MonthlyPhoto.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['id', 'full_name', 'profile_image'] },
        { model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] },
      ],
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    return success(res, rows.map(mapPhoto), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const listMonthlyPhotos = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const where = { student_id: req.params.studentId };
    if (req.query.month) where.month = parseInt(req.query.month, 10);
    if (req.query.year) where.year = parseInt(req.query.year, 10);

    const { page, limit, offset } = parsePagination(req.query);
    const { rows, count } = await MonthlyPhoto.findAndCountAll({
      where,
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    return success(res, rows.map(mapPhoto), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const createMonthlyPhoto = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);
    if (!req.file) throw new AppError('Student photo is required', 400);

    const now = new Date();
    const month = parseInt(req.body.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.body.year, 10) || now.getFullYear();
    if (month < 1 || month > 12) throw new AppError('Month must be between 1 and 12', 400);

    const photoPath = `uploads/photos/${req.file.filename}`;
    const payload = {
      student_id: student.id,
      month,
      year,
      photo: photoPath,
      notes: req.body.notes || null,
      taken_at: req.body.taken_at || now.toISOString().slice(0, 10),
      added_by: req.user.id,
    };

    const existing = await MonthlyPhoto.findOne({
      where: { student_id: student.id, month, year },
    });

    let record;
    if (existing) {
      await existing.update(payload);
      record = existing;
    } else {
      record = await MonthlyPhoto.create(payload);
    }

    const full = await MonthlyPhoto.findByPk(record.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });

    return success(res, mapPhoto(full), null, existing ? 200 : 201);
  } catch (err) {
    next(err);
  }
};

const updateMonthlyPhoto = async (req, res, next) => {
  try {
    const record = await MonthlyPhoto.findByPk(req.params.id);
    if (!record) throw new AppError('Monthly photo not found', 404);

    const updates = { ...req.body };
    if (req.file) updates.photo = `uploads/photos/${req.file.filename}`;
    if (updates.month) updates.month = parseInt(updates.month, 10);
    if (updates.year) updates.year = parseInt(updates.year, 10);
    delete updates.student_id;
    delete updates.added_by;

    await record.update(updates);
    const full = await MonthlyPhoto.findByPk(record.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapPhoto(full));
  } catch (err) {
    next(err);
  }
};

const deleteMonthlyPhoto = async (req, res, next) => {
  try {
    const record = await MonthlyPhoto.findByPk(req.params.id);
    if (!record) throw new AppError('Monthly photo not found', 404);
    await record.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAllMonthlyPhotos,
  listMonthlyPhotos,
  createMonthlyPhoto,
  updateMonthlyPhoto,
  deleteMonthlyPhoto,
};
