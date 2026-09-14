const { Op } = require('sequelize');
const {
  Student,
  InitialReport,
  MonthlyRecord,
  DoctorVisit,
  Payment,
  FamilyMeeting,
  MonthlyPhoto,
  Pickup,
} = require('../models');
const AppError = require('../utils/AppError');
const { toPublicUrl, calcAge, parsePagination, success } = require('../utils/helpers');
const { parseMoneyField, parseOptionalText, buildFeeLedger, toMoneyOrNull } = require('../utils/feeLedger');

const mapStudent = (student) => {
  const data = student.toJSON ? student.toJSON() : { ...student };
  data.profile_image = toPublicUrl(data.profile_image);
  data.discharge_image = toPublicUrl(data.discharge_image);
  data.aadhar_image = toPublicUrl(data.aadhar_image);
  data.family_aadhar_image = toPublicUrl(data.family_aadhar_image);
  data.agreed_fee = toMoneyOrNull(data.agreed_fee);
  data.monthly_fee = toMoneyOrNull(data.monthly_fee);
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
    const { search, status } = req.query;
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

    const { rows, count } = await Student.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return success(res, rows.map(mapStudent), {
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

    return success(res, data);
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
      agreed_fee: parseMoneyField(body.agreed_fee) ?? null,
      monthly_fee: parseMoneyField(body.monthly_fee) ?? null,
      referred_by: body.referred_by || null,
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
    if (body.agreed_fee !== undefined) updates.agreed_fee = parseMoneyField(body.agreed_fee);
    if (body.monthly_fee !== undefined) updates.monthly_fee = parseMoneyField(body.monthly_fee);

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
