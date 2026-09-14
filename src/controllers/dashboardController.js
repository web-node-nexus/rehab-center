const { Op, fn, col } = require('sequelize');
const { Student, MonthlyRecord, DoctorVisit, Payment, FamilyMeeting } = require('../models');
const { success } = require('../utils/helpers');

const periodBounds = (date = new Date()) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { month, year, start, end };
};

const toMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
};

const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const { month, year, start, end } = periodBounds(now);
    const today = now.toISOString().slice(0, 10);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [
      totalStudents,
      activeStudents,
      testsThisMonth,
      upcomingVisits,
      thisMonthIncomeRow,
      totalIncomeRow,
      paymentsThisMonth,
    ] = await Promise.all([
      Student.count(),
      Student.count({ where: { status: 'active' } }),
      MonthlyRecord.count({ where: { month, year } }),
      DoctorVisit.count({
        where: {
          next_visit_date: { [Op.between]: [today, inTwoWeeks] },
        },
      }),
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: { payment_date: { [Op.between]: [start, end] } },
        raw: true,
      }),
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        raw: true,
      }),
      Payment.count({
        where: { payment_date: { [Op.between]: [start, end] } },
      }),
    ]);

    const testedStudentIds = await MonthlyRecord.findAll({
      where: { month, year },
      attributes: ['student_id'],
      group: ['student_id'],
      raw: true,
    });
    const testedIds = testedStudentIds.map((r) => r.student_id);
    const testsDue = await Student.count({
      where: {
        status: 'active',
        ...(testedIds.length ? { id: { [Op.notIn]: testedIds } } : {}),
      },
    });

    const paidStudentIds = await Payment.findAll({
      where: { for_month: month, for_year: year },
      attributes: ['student_id'],
      group: ['student_id'],
      raw: true,
    });
    const paidIds = paidStudentIds.map((r) => r.student_id);
    const unpaidThisMonth = await Student.count({
      where: {
        status: 'active',
        ...(paidIds.length ? { id: { [Op.notIn]: paidIds } } : {}),
      },
    });

    return success(res, {
      totalStudents,
      activeStudents,
      testsThisMonth,
      testsDue,
      upcomingVisits,
      thisMonthIncome: toMoney(thisMonthIncomeRow?.total),
      totalIncome: toMoney(totalIncomeRow?.total),
      paymentsThisMonth,
      unpaidThisMonth,
      month,
      year,
    });
  } catch (err) {
    next(err);
  }
};

const getReminders = async (req, res, next) => {
  try {
    const now = new Date();
    const { month, year } = periodBounds(now);
    const today = now.toISOString().slice(0, 10);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const testedStudentIds = await MonthlyRecord.findAll({
      where: { month, year },
      attributes: ['student_id'],
      group: ['student_id'],
      raw: true,
    });
    const testedIds = testedStudentIds.map((r) => r.student_id);

    const pendingTests = await Student.findAll({
      where: {
        status: 'active',
        ...(testedIds.length ? { id: { [Op.notIn]: testedIds } } : {}),
      },
      attributes: ['id', 'full_name', 'phone_number'],
      order: [['full_name', 'ASC']],
      limit: 50,
    });

    const upcomingVisitRows = await DoctorVisit.findAll({
      where: {
        next_visit_date: { [Op.between]: [today, inTwoWeeks] },
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'phone_number', 'status'],
        },
      ],
      order: [['next_visit_date', 'ASC']],
      limit: 50,
    });

    const upcomingVisits = upcomingVisitRows
      .filter((v) => v.student && v.student.status === 'active')
      .map((v) => ({
        visitId: v.id,
        studentId: v.student_id,
        fullName: v.student.full_name,
        phoneNumber: v.student.phone_number,
        nextVisitDate: v.next_visit_date,
        diagnosis: v.diagnosis,
      }));

    const paidStudentIds = await Payment.findAll({
      where: { for_month: month, for_year: year },
      attributes: ['student_id'],
      group: ['student_id'],
      raw: true,
    });
    const paidIds = paidStudentIds.map((r) => r.student_id);
    const unpaidStudents = await Student.findAll({
      where: {
        status: 'active',
        ...(paidIds.length ? { id: { [Op.notIn]: paidIds } } : {}),
      },
      attributes: ['id', 'full_name', 'phone_number'],
      order: [['full_name', 'ASC']],
      limit: 50,
    });

    const upcomingMeetingRows = await FamilyMeeting.findAll({
      where: {
        next_meeting_date: { [Op.between]: [today, inTwoWeeks] },
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'phone_number', 'status'],
        },
      ],
      order: [['next_meeting_date', 'ASC']],
      limit: 50,
    });

    const upcomingMeetings = upcomingMeetingRows
      .filter((m) => m.student && m.student.status === 'active')
      .map((m) => ({
        meetingId: m.id,
        studentId: m.student_id,
        fullName: m.student.full_name,
        phoneNumber: m.student.phone_number,
        nextMeetingDate: m.next_meeting_date,
        meetingNo: m.meeting_no,
      }));

    return success(res, {
      month,
      year,
      pendingTests: pendingTests.map((s) => ({
        studentId: s.id,
        fullName: s.full_name,
        phoneNumber: s.phone_number,
      })),
      upcomingVisits,
      unpaidStudents: unpaidStudents.map((s) => ({
        studentId: s.id,
        fullName: s.full_name,
        phoneNumber: s.phone_number,
      })),
      upcomingMeetings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getReminders };
