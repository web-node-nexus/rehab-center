const { MonthlyRecord, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, parsePagination, success } = require('../utils/helpers');

const mapRecord = (record) => {
  const data = record.toJSON ? record.toJSON() : { ...record };
  data.pdf_report = toPublicUrl(data.pdf_report);
  return data;
};

const listMonthlyRecords = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const where = { student_id: req.params.studentId };
    if (req.query.month) where.month = parseInt(req.query.month, 10);
    if (req.query.year) where.year = parseInt(req.query.year, 10);

    const { page, limit, offset } = parsePagination(req.query);
    const { rows, count } = await MonthlyRecord.findAndCountAll({
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

    return success(res, rows.map(mapRecord), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const createMonthlyRecord = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const { test_name, month, year } = req.body;
    if (!test_name) throw new AppError('Test name is required', 400);
    if (!month || !year) throw new AppError('Month and year are required', 400);

    const record = await MonthlyRecord.create({
      student_id: student.id,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      test_name,
      test_result_summary: req.body.test_result_summary || null,
      pdf_report: req.file ? `uploads/reports/${req.file.filename}` : null,
      weight_at_test: req.body.weight_at_test || null,
      bp_reading: req.body.bp_reading || null,
      pulse_reading: req.body.pulse_reading || null,
      temperature: req.body.temperature || null,
      added_by: req.user.id,
    });

    return success(res, mapRecord(record), null, 201);
  } catch (err) {
    next(err);
  }
};

const updateMonthlyRecord = async (req, res, next) => {
  try {
    const record = await MonthlyRecord.findByPk(req.params.id);
    if (!record) throw new AppError('Monthly record not found', 404);

    const updates = { ...req.body };
    if (req.file) {
      updates.pdf_report = `uploads/reports/${req.file.filename}`;
    }

    await record.update(updates);
    return success(res, mapRecord(record));
  } catch (err) {
    next(err);
  }
};

const deleteMonthlyRecord = async (req, res, next) => {
  try {
    const record = await MonthlyRecord.findByPk(req.params.id);
    if (!record) throw new AppError('Monthly record not found', 404);
    await record.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listMonthlyRecords,
  createMonthlyRecord,
  updateMonthlyRecord,
  deleteMonthlyRecord,
};
