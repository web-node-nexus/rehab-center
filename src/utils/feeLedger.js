const { fn, col } = require('sequelize');
const { Payment, Pickup } = require('../models');

const toMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
};

const toMoneyOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
};

const parseMoneyField = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
};

const parseOptionalText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const buildFeeLedger = async (student) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [paymentTotal, thisMonthTotal, pickupCharged, pickupPaidRow, pickupCount] =
    await Promise.all([
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: { student_id: student.id },
        raw: true,
      }),
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: {
          student_id: student.id,
          for_month: month,
          for_year: year,
        },
        raw: true,
      }),
      Pickup.findOne({
        attributes: [[fn('SUM', col('pickup_charges')), 'total']],
        where: { student_id: student.id },
        raw: true,
      }),
      Pickup.findOne({
        attributes: [[fn('SUM', col('pickup_charges')), 'total']],
        where: { student_id: student.id, is_paid: true },
        raw: true,
      }),
      Pickup.count({ where: { student_id: student.id } }),
    ]);

  const agreedFee = toMoneyOrNull(student.agreed_fee);
  const monthlyFee = toMoneyOrNull(student.monthly_fee);
  const paid = toMoney(paymentTotal?.total);
  const thisMonthPaid = toMoney(thisMonthTotal?.total);
  const pickupCharges = toMoney(pickupCharged?.total);
  const pickupPaid = toMoney(pickupPaidRow?.total);

  return {
    agreedFee,
    monthlyFee,
    paid,
    pending: agreedFee == null ? null : Number(Math.max(0, agreedFee - paid).toFixed(2)),
    thisMonthPaid,
    thisMonthDue:
      monthlyFee == null ? null : Number(Math.max(0, monthlyFee - thisMonthPaid).toFixed(2)),
    pickupCharges,
    pickupPaid,
    pickupDue: Number(Math.max(0, pickupCharges - pickupPaid).toFixed(2)),
    pickupCount,
  };
};

module.exports = {
  toMoney,
  toMoneyOrNull,
  parseMoneyField,
  parseOptionalText,
  buildFeeLedger,
};
