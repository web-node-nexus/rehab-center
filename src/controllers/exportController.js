const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Student, InitialReport, MonthlyRecord, DoctorVisit, User } = require('../models');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const { toPublicUrl } = require('../utils/helpers');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ensureExportsDir = () => {
  const dir = path.join(__dirname, '../../uploads/exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const uploadsRoot = () => path.join(__dirname, '../../');

const resolveLocalFile = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    try {
      const u = new URL(relativePath);
      const maybe = path.join(uploadsRoot(), u.pathname.replace(/^\/+/, ''));
      return fs.existsSync(maybe) ? maybe : null;
    } catch {
      return null;
    }
  }
  const clean = relativePath.replace(/^\/+/, '');
  const full = path.join(uploadsRoot(), clean);
  return fs.existsSync(full) ? full : null;
};

const baseUrlFromReq = (req) => {
  const configured = (env.host || '').replace(/\/$/, '');
  if (
    configured &&
    !configured.includes('localhost') &&
    !configured.includes('127.0.0.1')
  ) {
    return configured;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
};

const fileUrl = (relativePath, baseUrl) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return `${baseUrl}/${String(relativePath).replace(/^\/+/, '')}`;
};

const line = (doc, label, value) => {
  if (value === null || value === undefined || value === '') return;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(`${label}: `, {
    continued: true,
  });
  doc.font('Helvetica').fillColor('#0F172A').text(String(value));
};

const linkLine = (doc, label, url) => {
  if (!url) return;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text(`${label}: `);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#1D4E89')
    .text(url, {
      link: url,
      underline: true,
    });
  doc.fillColor('#0F172A');
};

const sectionTitle = (doc, title) => {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#2D5A27').text(title);
  doc
    .moveTo(doc.page.margins.left, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor('#C4A35A')
    .lineWidth(1.2)
    .stroke();
  doc.moveDown(0.5);
};

const ensureSpace = (doc, needed = 120) => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
};

const drawEmbeddedImage = (doc, relativePath, opts = {}) => {
  const local = resolveLocalFile(relativePath);
  if (!local) return false;
  try {
    ensureSpace(doc, (opts.height || 140) + 24);
    const x = opts.x ?? doc.page.margins.left;
    const y = doc.y;
    doc.image(local, x, y, {
      fit: opts.fit || [140, 140],
      align: 'left',
      valign: 'top',
    });
    doc.y = y + (opts.height || 140) + 8;
    return true;
  } catch {
    return false;
  }
};

const exportStudentPdf = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) throw new AppError('Student not found', 404);

    const baseUrl = baseUrlFromReq(req);

    const [initialReports, monthlyRecords, doctorVisits] = await Promise.all([
      InitialReport.findAll({
        where: { student_id: student.id },
        order: [['uploaded_at', 'DESC']],
      }),
      MonthlyRecord.findAll({
        where: { student_id: student.id },
        include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name'] }],
        order: [['year', 'DESC'], ['month', 'DESC'], ['created_at', 'DESC']],
      }),
      DoctorVisit.findAll({
        where: { student_id: student.id },
        include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'role'] }],
        order: [['visit_date', 'DESC'], ['created_at', 'DESC']],
      }),
    ]);

    const exportsDir = ensureExportsDir();
    const safeName = student.full_name.replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    const filename = `student_${student.id}_${safeName}_${Date.now()}.pdf`;
    const filePath = path.join(exportsDir, filename);

    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
      info: {
        Title: `Student Profile — ${student.full_name}`,
        Author: 'Rebirth Rehabilitation Centre',
        Subject: 'Full medical history export',
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#2D5A27').text('Rebirth Rehabilitation Centre');
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#5D3A1A')
      .text('Hope is Alive Here — Full Student Medical Report');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#94A3B8').text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(0.6);

    // Profile + photo
    sectionTitle(doc, '1. Student Profile');
    if (student.profile_image) {
      const embedded = drawEmbeddedImage(doc, student.profile_image, {
        fit: [130, 130],
        height: 130,
      });
      if (!embedded) {
        doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Profile photo on file (see URL below).');
      }
      linkLine(doc, 'Profile photo URL', fileUrl(student.profile_image, baseUrl));
      doc.moveDown(0.3);
    }
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0F172A').text(student.full_name);
    doc.moveDown(0.3);

    line(doc, 'Status', student.status);
    line(doc, 'Age', student.age != null ? `${student.age} years` : null);
    line(doc, 'Date of Birth', student.date_of_birth);
    line(doc, 'Gender', student.gender);
    line(doc, 'Blood Group', student.blood_group);
    line(doc, 'Weight', student.weight != null ? `${student.weight} kg` : null);
    line(doc, 'Height', student.height != null ? `${student.height} cm` : null);
    line(doc, 'Phone', student.phone_number);
    line(doc, 'Alternate Phone', student.alternate_phone);
    line(doc, 'Address', student.address);
    line(doc, 'Date of Joining', student.date_of_joining);
    line(doc, 'Discharge Date', student.discharge_date);
    line(doc, 'Admission Reason', student.admission_reason);
    line(doc, 'Known Allergies', student.known_allergies);
    line(doc, 'Past Medical History', student.past_medical_history);
    line(doc, 'Current Medications', student.current_medications);
    line(doc, 'Referred By', student.referred_by);
    line(doc, 'Notes', student.notes);

    if (student.discharge_image) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Discharge photo');
      drawEmbeddedImage(doc, student.discharge_image, { fit: [160, 160], height: 160 });
      linkLine(doc, 'Discharge photo URL', fileUrl(student.discharge_image, baseUrl));
    }

    sectionTitle(doc, '2. Family & Emergency Contacts');
    line(doc, 'Family Member', student.family_member_name);
    line(doc, 'Relation', student.family_member_relation);
    line(doc, 'Family Phone', student.family_member_phone);
    line(doc, 'Family Address', student.family_member_address);
    line(doc, 'Emergency Contact', student.emergency_contact_name);
    line(doc, 'Emergency Relation', student.emergency_contact_relation);
    line(doc, 'Emergency Phone', student.emergency_contact_phone);

    // Initial reports
    sectionTitle(doc, `3. Initial Reports (${initialReports.length})`);
    if (!initialReports.length) {
      doc.font('Helvetica').fontSize(10).fillColor('#64748B').text('No initial reports on file.');
    } else {
      initialReports.forEach((r, i) => {
        ensureSpace(doc, 90);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0F172A')
          .text(`${i + 1}. ${r.report_title} (${r.report_type})`);
        line(
          doc,
          'Uploaded',
          r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString() : null
        );
        line(doc, 'Notes', r.notes);
        linkLine(doc, 'Report PDF URL', fileUrl(r.pdf_file, baseUrl));
        doc.moveDown(0.3);
      });
    }

    // Monthly records
    sectionTitle(doc, `4. Monthly Test Records (${monthlyRecords.length})`);
    if (!monthlyRecords.length) {
      doc.font('Helvetica').fontSize(10).fillColor('#64748B').text('No monthly records on file.');
    } else {
      monthlyRecords.forEach((r, i) => {
        ensureSpace(doc, 110);
        const period = `${MONTHS[(r.month || 1) - 1]} ${r.year}`;
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0F172A')
          .text(`${i + 1}. ${r.test_name} — ${period}`);
        line(doc, 'Result Summary', r.test_result_summary);
        line(doc, 'BP', r.bp_reading);
        line(doc, 'Pulse', r.pulse_reading);
        line(doc, 'Temperature', r.temperature);
        line(doc, 'Weight', r.weight_at_test != null ? `${r.weight_at_test} kg` : null);
        line(doc, 'Added By', r.addedByUser?.name);
        if (r.pdf_report) {
          linkLine(doc, 'Monthly report PDF URL', fileUrl(r.pdf_report, baseUrl));
        } else {
          line(doc, 'Report PDF', 'Not uploaded');
        }
        doc.moveDown(0.35);
      });
    }

    // Doctor visits
    sectionTitle(doc, `5. Doctor Visits & Prescriptions (${doctorVisits.length})`);
    if (!doctorVisits.length) {
      doc.font('Helvetica').fontSize(10).fillColor('#64748B').text('No doctor visits on file.');
    } else {
      doctorVisits.forEach((v, i) => {
        ensureSpace(doc, 160);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0F172A')
          .text(`${i + 1}. Visit — ${v.visit_date}`);
        line(doc, 'Doctor', v.doctor?.name);
        line(doc, 'BP', v.bp);
        line(doc, 'Pulse', v.pulse);
        line(doc, 'Temperature', v.temperature);
        line(doc, 'Weight', v.weight != null ? `${v.weight} kg` : null);
        line(doc, 'SpO2', v.spo2);
        line(doc, 'Symptoms', v.symptoms_observed);
        line(doc, 'Diagnosis', v.diagnosis);
        line(doc, 'Prescription', v.prescription_text);
        line(doc, 'Next Visit', v.next_visit_date);
        if (v.prescription_pdf) {
          linkLine(doc, 'Prescription PDF URL', fileUrl(v.prescription_pdf, baseUrl));
        }
        if (v.prescription_image) {
          drawEmbeddedImage(doc, v.prescription_image, { fit: [160, 160], height: 160 });
          linkLine(doc, 'Prescription image URL', fileUrl(v.prescription_image, baseUrl));
        }
        doc.moveDown(0.35);
      });
    }

    // Attachment index
    sectionTitle(doc, '6. Attachment Index (open these links)');
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748B')
      .text(
        'Tap / click any blue link above or listed here to open the original file on the server.'
      );
    doc.moveDown(0.3);

    const pushIndex = (label, relative) => {
      const url = fileUrl(relative, baseUrl);
      if (!url) return;
      linkLine(doc, label, url);
    };

    pushIndex('Student profile photo', student.profile_image);
    pushIndex('Discharge photo', student.discharge_image);
    initialReports.forEach((r, i) => pushIndex(`Initial report ${i + 1}: ${r.report_title}`, r.pdf_file));
    monthlyRecords.forEach((r, i) =>
      pushIndex(`Monthly report ${i + 1}: ${r.test_name}`, r.pdf_report)
    );
    doctorVisits.forEach((v, i) => {
      pushIndex(`Visit ${i + 1} prescription PDF (${v.visit_date})`, v.prescription_pdf);
      pushIndex(`Visit ${i + 1} clinical image (${v.visit_date})`, v.prescription_image);
    });

    doc.moveDown(1.2);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#94A3B8')
      .text(
        'This document is generated for clinical/family record purposes. Treat as confidential medical information. File URLs require access to the Rebirth Rehabilitation Centre server network.',
        { align: 'center' }
      );

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const download = req.query.download !== 'false';
    if (download) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeName}_full_profile.pdf"`
      );
      return res.sendFile(filePath);
    }

    const relative = `uploads/exports/${filename}`;
    return res.json({
      success: true,
      data: {
        url: toPublicUrl(relative) || `${baseUrl}/${relative}`,
        path: relative,
        filename: `${safeName}_full_profile.pdf`,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { exportStudentPdf };
