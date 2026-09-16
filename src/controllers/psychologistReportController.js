const { PsychologistReport, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { success } = require('../utils/helpers');
const { parseOptionalText } = require('../utils/feeLedger');

const CAUSE_KEYS = [
  'pre_morbid_personality',
  'depression',
  'anxiety',
  'frustration',
  'loneliness',
  'curiosity',
  'peer_pressure',
  'individual_problem',
  'family_problem',
  'other',
];

const parseCauses = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((key) => CAUSE_KEYS.includes(key));
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((key) => CAUSE_KEYS.includes(String(key)));
    }
  } catch {
    // comma-separated fallback
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter((key) => CAUSE_KEYS.includes(key));
};

const mapReport = (report) => {
  if (!report) return null;
  const data = report.toJSON ? report.toJSON() : { ...report };
  data.cause_of_addiction = parseCauses(data.cause_of_addiction);
  return data;
};

const getPsychologistReport = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const report = await PsychologistReport.findOne({
      where: { student_id: student.id },
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });

    return success(res, mapReport(report));
  } catch (err) {
    next(err);
  }
};

const upsertPsychologistReport = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const body = req.body || {};
    const payload = {
      first_time_consuming: parseOptionalText(body.first_time_consuming),
      reasons_inability_to_quit: parseOptionalText(body.reasons_inability_to_quit),
      reasons_relapsing: parseOptionalText(body.reasons_relapsing),
      type_of_problem: parseOptionalText(body.type_of_problem),
      mental_state: parseOptionalText(body.mental_state),
      cause_of_addiction: JSON.stringify(parseCauses(body.cause_of_addiction)),
      notes: parseOptionalText(body.notes),
      added_by: req.user.id,
    };

    const existing = await PsychologistReport.findOne({
      where: { student_id: student.id },
    });

    if (existing) {
      await existing.update(payload);
    } else {
      await PsychologistReport.create({
        student_id: student.id,
        ...payload,
      });
    }

    const full = await PsychologistReport.findOne({
      where: { student_id: student.id },
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });

    return success(res, mapReport(full), null, existing ? 200 : 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPsychologistReport,
  upsertPsychologistReport,
  mapReport,
  parseCauses,
};
