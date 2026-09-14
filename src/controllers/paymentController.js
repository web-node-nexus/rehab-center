const { Op, fn, col } = require('sequelize');
const { Payment, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, parsePagination, success } = require('../utils/helpers');
const { toMoney, buildFeeLedger } = require('../utils/feeLedger');

const METHODS = ['cash', 'upi', 'bank', 'card', 'other'];

const mapPayment = (row) => {
  const data = row.toJSON ? row.toJSON() : { ...row };
  data.amount = toMoney(data.amount);
  data.receipt_image = toPublicUrl(data.receipt_image);
  return data;
};

const requireStudent = async (studentId) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw new AppError('Student not found', 404);
  return student;
};

const parseAmount = (raw) => {
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('A valid payment amount is required', 400);
  }
  return Number(amount.toFixed(2));
};

const parsePeriod = (body, fallbackDate) => {
  const date = body.payment_date || fallbackDate;
  const parsedDate = date ? new Date(date) : new Date();
  const month = parseInt(body.for_month, 10) || parsedDate.getMonth() + 1;
  const year = parseInt(body.for_year, 10) || parsedDate.getFullYear();
  if (month < 1 || month > 12) throw new AppError('Month must be between 1 and 12', 400);
  if (!year || year < 2000) throw new AppError('A valid year is required', 400);
  return { month, year, payment_date: date || parsedDate.toISOString().slice(0, 10) };
};

const listStudentPayments = async (req, res, next) => {
  try {
    const student = await requireStudent(req.params.studentId);
    const { page, limit, offset } = parsePagination(req.query);
    const where = { student_id: req.params.studentId };
    if (req.query.month) where.for_month = parseInt(req.query.month, 10);
    if (req.query.year) where.for_year = parseInt(req.query.year, 10);

    const { rows, count } = await Payment.findAndCountAll({
      where,
      include: [{ model: User, as: 'receivedByUser', attributes: ['id', 'name', 'role'] }],
      order: [
        ['payment_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    const [allTime, thisMonth] = await Promise.all([
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: { student_id: req.params.studentId },
        raw: true,
      }),
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: {
          student_id: req.params.studentId,
          for_month: parseInt(req.query.month, 10) || new Date().getMonth() + 1,
          for_year: parseInt(req.query.year, 10) || new Date().getFullYear(),
        },
        raw: true,
      }),
    ]);

    return success(
      res,
      rows.map(mapPayment),
      {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        totals: {
          allTime: toMoney(allTime?.total),
          selectedPeriod: toMoney(thisMonth?.total),
          ledger: await buildFeeLedger(student),
        },
      }
    );
  } catch (err) {
    next(err);
  }
};

const listAllPayments = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};
    if (req.query.month) where.for_month = parseInt(req.query.month, 10);
    if (req.query.year) where.for_year = parseInt(req.query.year, 10);
    if (req.query.method && METHODS.includes(req.query.method)) {
      where.method = req.query.method;
    }
    if (req.query.from && req.query.to) {
      where.payment_date = { [Op.between]: [req.query.from, req.query.to] };
    }

    const studentWhere = {};
    if (req.query.search && String(req.query.search).trim()) {
      const q = `%${String(req.query.search).trim()}%`;
      studentWhere[Op.or] = [
        { full_name: { [Op.like]: q } },
        { phone_number: { [Op.like]: q } },
      ];
    }

    const { rows, count } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'phone_number', 'status', 'profile_image'],
          where: Object.keys(studentWhere).length ? studentWhere : undefined,
        },
        { model: User, as: 'receivedByUser', attributes: ['id', 'name', 'role'] },
      ],
      order: [
        ['payment_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [thisMonthIn, allTime, byMethod] = await Promise.all([
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: { payment_date: { [Op.between]: [start, end] } },
        raw: true,
      }),
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        raw: true,
      }),
      Payment.findAll({
        attributes: ['method', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
        where: { payment_date: { [Op.between]: [start, end] } },
        group: ['method'],
        raw: true,
      }),
    ]);

    return success(
      res,
      rows.map((row) => {
        const data = mapPayment(row);
        if (data.student) {
          data.student.profile_image = toPublicUrl(data.student.profile_image);
        }
        return data;
      }),
      {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        totals: {
          thisMonthIn: toMoney(thisMonthIn?.total),
          allTime: toMoney(allTime?.total),
          byMethod: (byMethod || []).map((m) => ({
            method: m.method,
            total: toMoney(m.total),
            count: Number(m.count) || 0,
          })),
        },
      }
    );
  } catch (err) {
    next(err);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const student = await requireStudent(req.params.studentId);
    const amount = parseAmount(req.body.amount);
    const { month, year, payment_date } = parsePeriod(req.body);
    const method = METHODS.includes(req.body.method) ? req.body.method : 'cash';

    const payment = await Payment.create({
      student_id: student.id,
      amount,
      payment_date,
      for_month: month,
      for_year: year,
      method,
      receipt_no: req.body.receipt_no || null,
      receipt_image: req.file ? `uploads/receipts/${req.file.filename}` : null,
      notes: req.body.notes || null,
      received_by: req.user.id,
    });

    const full = await Payment.findByPk(payment.id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'full_name', 'phone_number', 'status'] },
        { model: User, as: 'receivedByUser', attributes: ['id', 'name', 'role'] },
      ],
    });

    return success(res, mapPayment(full), null, 201);
  } catch (err) {
    next(err);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);

    const updates = { ...req.body };
    if (req.body.amount != null && req.body.amount !== '') {
      updates.amount = parseAmount(req.body.amount);
    }
    if (req.body.method && !METHODS.includes(req.body.method)) {
      throw new AppError('Invalid payment method', 400);
    }
    if (req.body.for_month) updates.for_month = parseInt(req.body.for_month, 10);
    if (req.body.for_year) updates.for_year = parseInt(req.body.for_year, 10);
    if (req.file) updates.receipt_image = `uploads/receipts/${req.file.filename}`;

    delete updates.student_id;
    delete updates.received_by;

    await payment.update(updates);
    const full = await Payment.findByPk(payment.id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'full_name', 'phone_number', 'status'] },
        { model: User, as: 'receivedByUser', attributes: ['id', 'name', 'role'] },
      ],
    });
    return success(res, mapPayment(full));
  } catch (err) {
    next(err);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) throw new AppError('Payment not found', 404);
    await payment.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listStudentPayments,
  listAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
};
