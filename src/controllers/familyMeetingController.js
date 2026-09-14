const { FamilyMeeting, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, success } = require('../utils/helpers');

const MAX_MEETINGS = 4;

const mapMeeting = (row) => (row.toJSON ? row.toJSON() : { ...row });

const listFamilyMeetings = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const { page, limit, offset } = parsePagination({ ...req.query, limit: req.query.limit || 20 });
    const { rows, count } = await FamilyMeeting.findAndCountAll({
      where: { student_id: req.params.studentId },
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
      order: [['meeting_date', 'ASC'], ['meeting_no', 'ASC']],
      limit,
      offset,
    });

    return success(res, rows.map(mapMeeting), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      remaining: Math.max(0, MAX_MEETINGS - count),
      maxMeetings: MAX_MEETINGS,
    });
  } catch (err) {
    next(err);
  }
};

const createFamilyMeeting = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);
    if (!req.body.meeting_date) throw new AppError('Meeting date is required', 400);

    const existingCount = await FamilyMeeting.count({ where: { student_id: student.id } });
    if (existingCount >= MAX_MEETINGS) {
      throw new AppError('A student can have at most 4 family meetings', 400);
    }

    const meeting = await FamilyMeeting.create({
      student_id: student.id,
      meeting_date: req.body.meeting_date,
      meeting_no: existingCount + 1,
      attendees: req.body.attendees || null,
      notes: req.body.notes || null,
      next_meeting_date: req.body.next_meeting_date || null,
      added_by: req.user.id,
    });

    const full = await FamilyMeeting.findByPk(meeting.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });

    return success(res, mapMeeting(full), {
      remaining: Math.max(0, MAX_MEETINGS - (existingCount + 1)),
      maxMeetings: MAX_MEETINGS,
    }, 201);
  } catch (err) {
    next(err);
  }
};

const updateFamilyMeeting = async (req, res, next) => {
  try {
    const meeting = await FamilyMeeting.findByPk(req.params.id);
    if (!meeting) throw new AppError('Family meeting not found', 404);

    const updates = { ...req.body };
    delete updates.student_id;
    delete updates.meeting_no;
    delete updates.added_by;

    await meeting.update(updates);
    const full = await FamilyMeeting.findByPk(meeting.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapMeeting(full));
  } catch (err) {
    next(err);
  }
};

const deleteFamilyMeeting = async (req, res, next) => {
  try {
    const meeting = await FamilyMeeting.findByPk(req.params.id);
    if (!meeting) throw new AppError('Family meeting not found', 404);
    const studentId = meeting.student_id;
    await meeting.destroy();

    const remaining = await FamilyMeeting.findAll({
      where: { student_id: studentId },
      order: [['meeting_date', 'ASC'], ['id', 'ASC']],
    });
    await Promise.all(
      remaining.map((row, idx) => row.update({ meeting_no: idx + 1 }))
    );

    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listFamilyMeetings,
  createFamilyMeeting,
  updateFamilyMeeting,
  deleteFamilyMeeting,
};
