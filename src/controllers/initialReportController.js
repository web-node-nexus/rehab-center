const { InitialReport, Student } = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, success } = require('../utils/helpers');

const mapReport = (report) => {
  const data = report.toJSON ? report.toJSON() : { ...report };
  data.pdf_file = toPublicUrl(data.pdf_file);
  return data;
};

const listInitialReports = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const reports = await InitialReport.findAll({
      where: { student_id: req.params.studentId },
      order: [['uploaded_at', 'DESC']],
    });

    return success(res, reports.map(mapReport));
  } catch (err) {
    next(err);
  }
};

const createInitialReport = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);
    if (!req.file) throw new AppError('PDF file is required', 400);

    const report = await InitialReport.create({
      student_id: student.id,
      report_title: req.body.report_title || 'Initial Report',
      report_type: req.body.report_type || 'other',
      pdf_file: `uploads/reports/${req.file.filename}`,
      notes: req.body.notes || null,
      uploaded_at: new Date(),
    });

    return success(res, mapReport(report), null, 201);
  } catch (err) {
    next(err);
  }
};

const deleteInitialReport = async (req, res, next) => {
  try {
    const report = await InitialReport.findByPk(req.params.id);
    if (!report) throw new AppError('Initial report not found', 404);
    await report.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listInitialReports,
  createInitialReport,
  deleteInitialReport,
};
