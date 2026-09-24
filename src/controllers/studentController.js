const { Op, literal } = require('sequelize');
const {
  User,
  Student,
  InitialReport,
  MonthlyRecord,
  DoctorVisit,
  Payment,
  FamilyMeeting,
  MonthlyPhoto,
  Pickup,
  PsychologistReport,
} = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, calcAge, parsePagination, success } = require('../utils/helpers');
const { parseMoneyField, parseOptionalText, parseIntField, computeMonthlyFee, computeGrandTotal, buildFeeLedger, toMoneyOrNull } = require('../utils/feeLedger');
const { mapReport } = require('./psychologistReportController');
const { shapeStudentForRole, normalizeRole } = require('../utils/access');

const isAdminUser = (req) => normalizeRole(req.jwtRole || req.user?.role) === 'admin';

const applyFeeFields = (body, target) => {
  if (body.admission_fee !== undefined) target.admission_fee = parseMoneyField(body.admission_fee);
  if (body.duration_months !== undefined) target.duration_months = parseIntField(body.duration_months);
  if (body.monthly_fee !== undefined) target.monthly_fee = parseMoneyField(body.monthly_fee);
  if (body.agreed_fee !== undefined) target.agreed_fee = parseMoneyField(body.agreed_fee);

  const monthly = target.monthly_fee !== undefined ? target.monthly_fee : undefined;
  const admission = target.admission_fee !== undefined ? target.admission_fee : undefined;
  const months = target.duration_months !== undefined ? target.duration_months : undefined;
  const total = target.agreed_fee !== undefined ? target.agreed_fee : undefined;

  if (monthly != null && months) {
    target.agreed_fee = computeGrandTotal(monthly, admission || 0, months);
  } else if (monthly == null && total != null && months) {
    target.monthly_fee = computeMonthlyFee(total, admission || 0, months);
  }
};

const mapStudent = (student) => {
  const data = student.toJSON ? student.toJSON() : { ...student };
  data.profile_image = toPublicUrl(data.profile_image);
  data.discharge_image = toPublicUrl(data.discharge_image);
  data.aadhar_image = toPublicUrl(data.aadhar_image);
  data.family_aadhar_image = toPublicUrl(data.family_aadhar_image);
  data.agreed_fee = toMoneyOrNull(data.agreed_fee);
  data.monthly_fee = toMoneyOrNull(data.monthly_fee);
  data.admission_fee = toMoneyOrNull(data.admission_fee);
  data.pickup_charges = toMoneyOrNull(data.pickup_charges);
  data.duration_months =
    data.duration_months == null ? null : Number(data.duration_months) || null;
  if (data.initial_reports) {
    data.initial_reports = data.initial_reports.map((r) => ({
      ...r,
      pdf_file: toPublicUrl(r.pdf_file),
    }));
  }
  return data;
};

const listStudents = async (req, res, next) => {
  try {
    const { search, status, join_month } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const where = {};
    if (status && ['active', 'discharged', 'inactive'].includes(status)) {
      where.status = status;
    }
    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [
        { full_name: { [Op.like]: q } },
        { phone_number: { [Op.like]: q } },
        { admission_reason: { [Op.like]: q } },
      ];
    }
    if (join_month && /^\d{4}-\d{2}$/.test(String(join_month))) {
      const [yearStr, monthStr] = String(join_month).split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const lastDay = new Date(year, month, 0).getDate();
      where.date_of_joining = {
        [Op.between]: [`${join_month}-01`, `${join_month}-${String(lastDay).padStart(2, '0')}`],
      };
    }

    const { rows, count } = await Student.findAndCountAll({
      where,
      order: [
        [literal('date_of_joining IS NULL'), 'ASC'],
        ['date_of_joining', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    return success(res, rows.map((row) => shapeStudentForRole(mapStudent(row), req.user.role)), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { model: InitialReport, as: 'initial_reports' },
        {
          model: MonthlyRecord,
          as: 'monthly_records',
          separate: true,
          order: [
            ['year', 'DESC'],
            ['month', 'DESC'],
            ['created_at', 'DESC'],
          ],
          limit: 20,
        },
        {
          model: DoctorVisit,
          as: 'doctor_visits',
          separate: true,
          order: [['visit_date', 'DESC']],
          limit: 20,
        },
        {
          model: Payment,
          as: 'payments',
          separate: true,
          order: [['payment_date', 'DESC']],
          limit: 20,
        },
        {
          model: FamilyMeeting,
          as: 'family_meetings',
          separate: true,
          order: [['meeting_date', 'ASC']],
        },
        {
          model: MonthlyPhoto,
          as: 'monthly_photos',
          separate: true,
          order: [
            ['year', 'DESC'],
            ['month', 'DESC'],
          ],
          limit: 12,
        },
        {
          model: Pickup,
          as: 'pickups',
          separate: true,
          order: [['form_date', 'DESC'], ['created_at', 'DESC']],
          limit: 10,
        },
        {
          model: PsychologistReport,
          as: 'psychologist_report',
          include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
        },
      ],
    });

    if (!student) throw new AppError('Student not found', 404);

    const [initialCount, monthlyCount, visitCount, paymentCount, meetingCount, photoCount, feeLedger] =
      await Promise.all([
        InitialReport.count({ where: { student_id: student.id } }),
        MonthlyRecord.count({ where: { student_id: student.id } }),
        DoctorVisit.count({ where: { student_id: student.id } }),
        Payment.count({ where: { student_id: student.id } }),
        FamilyMeeting.count({ where: { student_id: student.id } }),
        MonthlyPhoto.count({ where: { student_id: student.id } }),
        buildFeeLedger(student),
      ]);

    const data = mapStudent(student);
    data.counts = {
      initial_reports: initialCount,
      monthly_records: monthlyCount,
      doctor_visits: visitCount,
      payments: paymentCount,
      family_meetings: meetingCount,
      monthly_photos: photoCount,
      pickups: feeLedger.pickupCount,
    };
    data.payment_totals = {
      allTime: feeLedger.paid,
      thisMonth: feeLedger.thisMonthPaid,
    };
    data.fee_ledger = feeLedger;

    if (data.monthly_records) {
      data.monthly_records = data.monthly_records.map((r) => ({
        ...r,
        pdf_report: toPublicUrl(r.pdf_report),
      }));
    }
    if (data.doctor_visits) {
      data.doctor_visits = data.doctor_visits.map((v) => ({
        ...v,
        prescription_pdf: toPublicUrl(v.prescription_pdf),
        prescription_image: toPublicUrl(v.prescription_image),
        checkup_report: toPublicUrl(v.checkup_report),
      }));
    }
    if (data.payments) {
      data.payments = data.payments.map((p) => ({
        ...p,
        amount: Number(p.amount || 0),
        receipt_image: toPublicUrl(p.receipt_image),
      }));
    }
    if (data.monthly_photos) {
      data.monthly_photos = data.monthly_photos.map((p) => ({
        ...p,
        photo: toPublicUrl(p.photo),
      }));
    }
    if (data.pickups) {
      data.pickups = data.pickups.map((p) => ({
        ...p,
        pickup_charges: Number(p.pickup_charges || 0),
        monthly_rehab_charges:
          p.monthly_rehab_charges == null ? null : Number(p.monthly_rehab_charges),
        is_paid: Boolean(p.is_paid),
      }));
    }
    if (data.psychologist_report) {
      data.psychologist_report = mapReport(data.psychologist_report);
    }

    return success(res, shapeStudentForRole(data, req.user.role));
  } catch (err) {
    next(err);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.full_name || !String(body.full_name).trim()) {
      throw new AppError('Full name is required', 400);
    }
    const admittedBy = String(body.admitted_by || '').trim();
    if (admittedBy.length < 2) {
      throw new AppError('Admitted by is required', 400);
    }

    const age = body.age ? parseInt(body.age, 10) : calcAge(body.date_of_birth);
    const filePath = (field, folder) =>
      req.files?.[field]?.[0] ? `uploads/${folder}/${req.files[field][0].filename}` : null;

    let profileImage = filePath('profile_image', 'profiles');
    if (!profileImage && req.file) {
      profileImage = `uploads/profiles/${req.file.filename}`;
    }

    const student = await Student.create({
      full_name: body.full_name.trim(),
      profile_image: profileImage,
      aadhar_image: filePath('aadhar_image', 'aadhar'),
      date_of_birth: body.date_of_birth || null,
      age,
      gender: body.gender || null,
      weight: body.weight || null,
      scars_from_injury: body.scars_from_injury || null,
      phone_number: body.phone_number || null,
      alternate_phone: body.alternate_phone || null,
      address: body.address || null,
      date_of_joining: body.date_of_joining || null,
      admission_reason: body.admission_reason || null,
      known_allergies: body.known_allergies || null,
      past_medical_history: body.past_medical_history || null,
      current_medications: body.current_medications || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_relation: body.emergency_contact_relation || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      family_member_name: body.family_member_name || null,
      family_member_relation: body.family_member_relation || null,
      family_member_phone: body.family_member_phone || null,
      family_member_address: body.family_member_address || null,
      family_aadhar_image: filePath('family_aadhar_image', 'aadhar'),
      visiting_name: body.visiting_name || null,
      visiting_address: body.visiting_address || null,
      visiting_phone: body.visiting_phone || null,
      father_name: parseOptionalText(body.father_name),
      mother_name: parseOptionalText(body.mother_name),
      agreed_fee: isAdminUser(req)
        ? computeGrandTotal(
            parseMoneyField(body.monthly_fee),
            parseMoneyField(body.admission_fee) ?? 0,
            parseIntField(body.duration_months)
          ) ??
          parseMoneyField(body.agreed_fee) ??
          null
        : null,
      admission_fee: isAdminUser(req) ? parseMoneyField(body.admission_fee) ?? null : null,
      duration_months: isAdminUser(req) ? parseIntField(body.duration_months) ?? null : null,
      monthly_fee: isAdminUser(req)
        ? parseMoneyField(body.monthly_fee) ??
          computeMonthlyFee(
            parseMoneyField(body.agreed_fee),
            parseMoneyField(body.admission_fee) ?? 0,
            parseIntField(body.duration_months)
          )
        : null,
      referred_by: body.referred_by || null,
      admitted_by: admittedBy,
      pickup_by: parseOptionalText(body.pickup_by),
      pickup_charges: isAdminUser(req) ? parseMoneyField(body.pickup_charges) ?? null : null,
      status: body.status || 'active',
      discharge_date: body.discharge_date || null,
      notes: body.notes || null,
    });

    // Optional initial reports uploaded with create
    if (req.files?.initial_reports?.length) {
      let meta = [];
      try {
        meta = body.initial_report_meta ? JSON.parse(body.initial_report_meta) : [];
      } catch {
        meta = [];
      }
      const reports = req.files.initial_reports.map((file, idx) => ({
        student_id: student.id,
        report_title: meta[idx]?.title || `Initial Report ${idx + 1}`,
        report_type: meta[idx]?.type || 'other',
        pdf_file: `uploads/reports/${file.filename}`,
        notes: meta[idx]?.notes || null,
        uploaded_at: new Date(),
      }));
      await InitialReport.bulkCreate(reports);
    }

    const created = await Student.findByPk(student.id, {
      include: [{ model: InitialReport, as: 'initial_reports' }],
    });

    return success(res, mapStudent(created), null, 201);
  } catch (err) {
    next(err);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) throw new AppError('Student not found', 404);

    const body = req.body;
    const updates = { ...body };

    if (body.date_of_birth && !body.age) {
      updates.age = calcAge(body.date_of_birth);
    }
    if (body.age) updates.age = parseInt(body.age, 10);

    delete updates.initial_report_meta;
    delete updates.initial_reports;
    delete updates.profile_image;
    delete updates.aadhar_image;
    delete updates.family_aadhar_image;
    delete updates.discharge_image;

    if (body.father_name !== undefined) updates.father_name = parseOptionalText(body.father_name);
    if (body.mother_name !== undefined) updates.mother_name = parseOptionalText(body.mother_name);
    if (body.admitted_by !== undefined) updates.admitted_by = parseOptionalText(body.admitted_by);
    if (body.pickup_by !== undefined) updates.pickup_by = parseOptionalText(body.pickup_by);

    if (isAdminUser(req)) {
      if (body.pickup_charges !== undefined) {
        updates.pickup_charges = parseMoneyField(body.pickup_charges);
      }
      applyFeeFields(body, updates);
    } else {
      delete updates.pickup_charges;
      delete updates.agreed_fee;
      delete updates.monthly_fee;
      delete updates.admission_fee;
      delete updates.duration_months;
    }

    if (req.file) {
      updates.profile_image = `uploads/profiles/${req.file.filename}`;
    }
    if (req.files?.profile_image?.[0]) {
      updates.profile_image = `uploads/profiles/${req.files.profile_image[0].filename}`;
    }
    if (req.files?.aadhar_image?.[0]) {
      updates.aadhar_image = `uploads/aadhar/${req.files.aadhar_image[0].filename}`;
    }
    if (req.files?.family_aadhar_image?.[0]) {
      updates.family_aadhar_image = `uploads/aadhar/${req.files.family_aadhar_image[0].filename}`;
    }

    await student.update(updates);
    return success(res, mapStudent(student));
  } catch (err) {
    next(err);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) throw new AppError('Student not found', 404);

    const hard = req.query.hard === 'true' || req.query.hard === '1';
    if (hard) {
      const where = { student_id: student.id };
      await Promise.all([
        InitialReport.destroy({ where }),
        MonthlyRecord.destroy({ where }),
        DoctorVisit.destroy({ where }),
        Payment.destroy({ where }),
        FamilyMeeting.destroy({ where }),
        MonthlyPhoto.destroy({ where }),
        Pickup.destroy({ where }),
        PsychologistReport.destroy({ where }),
      ]);
      await student.destroy();
      return success(res, { id: Number(req.params.id), deleted: true });
    }

    await student.update({
      status: 'inactive',
      discharge_date: student.discharge_date || new Date().toISOString().slice(0, 10),
    });
    return success(res, mapStudent(student));
  } catch (err) {
    next(err);
  }
};

const dischargeStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) throw new AppError('Student not found', 404);

    if (!req.file) {
      throw new AppError('Discharge photo is required', 400);
    }

    const dischargeDate =
      req.body.discharge_date || new Date().toISOString().slice(0, 10);

    await student.update({
      status: 'discharged',
      discharge_date: dischargeDate,
      discharge_image: `uploads/profiles/${req.file.filename}`,
      notes: req.body.notes
        ? `${student.notes ? `${student.notes}\n` : ''}Discharge note: ${req.body.notes}`
        : student.notes,
    });

    return success(res, mapStudent(student));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  dischargeStudent,
};
