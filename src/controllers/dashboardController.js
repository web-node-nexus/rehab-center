const { Op, fn, col } = require('sequelize');
const { Student, MonthlyRecord, DoctorVisit, Payment, FamilyMeeting } = require('../models');
const { success, istPeriodBounds, addDaysISO } = require('../utils/helpers');
const { can } = require('../utils/access');

const toMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
};

const getStats = async (req, res, next) => {
  try {
    const { month, year, start, end, today } = istPeriodBounds();
    const inTwoWeeks = addDaysISO(today, 14);

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

    const payload = {
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
    };
    if (!can(req.user.role, 'payments')) {
      payload.thisMonthIncome = null;
      payload.totalIncome = null;
      payload.paymentsThisMonth = 0;
      payload.unpaidThisMonth = 0;
    }
    if (!can(req.user.role, 'doctorReport')) {
      payload.upcomingVisits = 0;
    }
    if (!can(req.user.role, 'monthlyTests')) {
      payload.testsThisMonth = 0;
      payload.testsDue = 0;
    }

    return success(res, payload);
  } catch (err) {
    next(err);
  }
};

const getReminders = async (req, res, next) => {
  try {
    const { month, year, today } = istPeriodBounds();
    const tomorrow = addDaysISO(today, 1);
    const inTwoWeeks = addDaysISO(today, 14);

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

    const todayMeetingRows = await FamilyMeeting.findAll({
      where: { meeting_date: today },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'phone_number', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    const todayMeetings = todayMeetingRows
      .filter((m) => m.student && m.student.status === 'active')
      .map((m) => ({
        meetingId: m.id,
        studentId: m.student_id,
        fullName: m.student.full_name,
        phoneNumber: m.student.phone_number,
        meetingDate: m.meeting_date,
        meetingNo: m.meeting_no,
        status: 'done',
      }));

    const todayStudentIds = todayMeetings.map((m) => m.studentId);

    const upcomingMeetingRows = await FamilyMeeting.findAll({
      where: {
        next_meeting_date: { [Op.between]: [tomorrow, inTwoWeeks] },
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
      .filter((m) => !todayStudentIds.includes(m.student_id))
      .map((m) => ({
        meetingId: m.id,
        studentId: m.student_id,
        fullName: m.student.full_name,
        phoneNumber: m.student.phone_number,
        nextMeetingDate: m.next_meeting_date,
        meetingNo: m.meeting_no,
      }));

    const dueTodayRows = await FamilyMeeting.findAll({
      where: {
        next_meeting_date: today,
        ...(todayStudentIds.length ? { student_id: { [Op.notIn]: todayStudentIds } } : {}),
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'full_name', 'phone_number', 'status'],
        },
      ],
      order: [['meeting_no', 'ASC']],
      limit: 50,
    });

    const dueTodayMeetings = dueTodayRows
      .filter((m) => m.student && m.student.status === 'active')
      .map((m) => ({
        meetingId: m.id,
        studentId: m.student_id,
        fullName: m.student.full_name,
        phoneNumber: m.student.phone_number,
        meetingDate: m.next_meeting_date,
        meetingNo: m.meeting_no,
        status: 'due',
      }));

    const role = req.user.role;
    return success(res, {
      month,
      year,
      pendingTests: can(role, 'monthlyTests')
        ? pendingTests.map((s) => ({
            studentId: s.id,
            fullName: s.full_name,
            phoneNumber: s.phone_number,
          }))
        : [],
      upcomingVisits: can(role, 'doctorReport') ? upcomingVisits : [],
      unpaidStudents: can(role, 'payments')
        ? unpaidStudents.map((s) => ({
            studentId: s.id,
            fullName: s.full_name,
            phoneNumber: s.phone_number,
          }))
        : [],
      upcomingMeetings,
      todayMeetings: [...todayMeetings, ...dueTodayMeetings],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getReminders };
