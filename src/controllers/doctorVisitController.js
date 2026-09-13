const { DoctorVisit, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, parsePagination, success } = require('../utils/helpers');

const filePath = (subdir, file) => (file ? `uploads/${subdir}/${file.filename}` : null);

const mapVisit = (visit) => {
  const data = visit.toJSON ? visit.toJSON() : { ...visit };
  data.prescription_pdf = toPublicUrl(data.prescription_pdf);
  data.prescription_image = toPublicUrl(data.prescription_image);
  return data;
};

const listDoctorVisits = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const { page, limit, offset } = parsePagination(req.query);
    const { rows, count } = await DoctorVisit.findAndCountAll({
      where: { student_id: req.params.studentId },
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'role', 'email'] }],
      order: [['visit_date', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    return success(res, rows.map(mapVisit), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const createDoctorVisit = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);
    if (!req.body.visit_date) throw new AppError('Visit date is required', 400);

    const pdfFile = req.files?.prescription_pdf?.[0] || (req.file?.fieldname === 'prescription_pdf' ? req.file : null);
    const imageFile =
      req.files?.prescription_image?.[0] ||
      (req.file?.fieldname === 'prescription_image' ? req.file : null);

    const visit = await DoctorVisit.create({
      student_id: student.id,
      visit_date: req.body.visit_date,
      doctor_id: req.body.doctor_id || req.user.id,
      bp: req.body.bp || null,
      pulse: req.body.pulse || null,
      temperature: req.body.temperature || null,
      weight: req.body.weight || null,
      spo2: req.body.spo2 || null,
      symptoms_observed: req.body.symptoms_observed || null,
      diagnosis: req.body.diagnosis || null,
      prescription_text: req.body.prescription_text || null,
      prescription_pdf: filePath('prescriptions', pdfFile),
      prescription_image: filePath('prescriptions', imageFile),
      next_visit_date: req.body.next_visit_date || null,
    });

    const full = await DoctorVisit.findByPk(visit.id, {
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'role', 'email'] }],
    });

    return success(res, mapVisit(full), null, 201);
  } catch (err) {
    next(err);
  }
};

const updateDoctorVisit = async (req, res, next) => {
  try {
    const visit = await DoctorVisit.findByPk(req.params.id);
    if (!visit) throw new AppError('Doctor visit not found', 404);

    const updates = { ...req.body };
    const pdfFile = req.files?.prescription_pdf?.[0];
    const imageFile = req.files?.prescription_image?.[0];
    if (pdfFile) updates.prescription_pdf = filePath('prescriptions', pdfFile);
    if (imageFile) updates.prescription_image = filePath('prescriptions', imageFile);
    if (req.file && req.file.fieldname === 'prescription_pdf') {
      updates.prescription_pdf = filePath('prescriptions', req.file);
    }

    await visit.update(updates);
    const full = await DoctorVisit.findByPk(visit.id, {
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'role', 'email'] }],
    });
    return success(res, mapVisit(full));
  } catch (err) {
    next(err);
  }
};

const deleteDoctorVisit = async (req, res, next) => {
  try {
    const visit = await DoctorVisit.findByPk(req.params.id);
    if (!visit) throw new AppError('Doctor visit not found', 404);
    await visit.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listDoctorVisits,
  createDoctorVisit,
  updateDoctorVisit,
  deleteDoctorVisit,
};
