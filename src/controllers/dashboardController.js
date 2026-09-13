const { Op } = require('sequelize');
const { Student, MonthlyRecord, DoctorVisit } = require('../models');
const { success } = require('../utils/helpers');

const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const today = now.toISOString().slice(0, 10);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [totalStudents, activeStudents, testsThisMonth, upcomingVisits] = await Promise.all([
      Student.count(),
      Student.count({ where: { status: 'active' } }),
      MonthlyRecord.count({ where: { month, year } }),
      DoctorVisit.count({
        where: {
          next_visit_date: { [Op.between]: [today, inTwoWeeks] },
        },
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

    return success(res, {
      totalStudents,
      activeStudents,
      testsThisMonth,
      testsDue,
      upcomingVisits,
    });
  } catch (err) {
    next(err);
  }
};

const getReminders = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
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

    return success(res, {
      month,
      year,
      pendingTests: pendingTests.map((s) => ({
        studentId: s.id,
        fullName: s.full_name,
        phoneNumber: s.phone_number,
      })),
      upcomingVisits,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getReminders };
