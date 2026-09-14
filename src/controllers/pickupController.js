const { Pickup, Student, User } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, success } = require('../utils/helpers');
const {
  toMoney,
  toMoneyOrNull,
  parseMoneyField,
  parseOptionalText,
  buildFeeLedger,
} = require('../utils/feeLedger');

const mapPickup = (row) => {
  const data = row.toJSON ? row.toJSON() : { ...row };
  data.pickup_charges = toMoney(data.pickup_charges);
  data.monthly_rehab_charges = toMoneyOrNull(data.monthly_rehab_charges);
  data.is_paid = Boolean(data.is_paid);
  return data;
};

const listPickups = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);

    const { page, limit, offset } = parsePagination({
      ...req.query,
      limit: req.query.limit || 50,
    });
    const { rows, count } = await Pickup.findAndCountAll({
      where: { student_id: req.params.studentId },
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
      order: [
        ['form_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    const ledger = await buildFeeLedger(student);

    return success(res, rows.map(mapPickup), {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      totals: {
        pickupCharges: ledger.pickupCharges,
        pickupPaid: ledger.pickupPaid,
        pickupDue: ledger.pickupDue,
        ledger,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createPickup = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId);
    if (!student) throw new AppError('Student not found', 404);
    if (!req.body.form_date) throw new AppError('Pickup date is required', 400);

    const pickup = await Pickup.create({
      student_id: student.id,
      form_date: req.body.form_date,
      requester_name: parseOptionalText(req.body.requester_name),
      patient_name: parseOptionalText(req.body.patient_name) || student.full_name,
      father_name: parseOptionalText(req.body.father_name) || student.father_name || null,
      mother_name: parseOptionalText(req.body.mother_name) || student.mother_name || null,
      pickup_address: parseOptionalText(req.body.pickup_address),
      pincode: parseOptionalText(req.body.pincode),
      phone: parseOptionalText(req.body.phone) || student.phone_number || null,
      pickup_charges: parseMoneyField(req.body.pickup_charges) ?? 0,
      monthly_rehab_charges:
        parseMoneyField(req.body.monthly_rehab_charges) ?? student.monthly_fee ?? null,
      starting_date: req.body.starting_date || null,
      pickup_members: parseOptionalText(req.body.pickup_members),
      pickup_incharge: parseOptionalText(req.body.pickup_incharge),
      guardian_name: parseOptionalText(req.body.guardian_name),
      notes: parseOptionalText(req.body.notes),
      is_paid: req.body.is_paid === true || req.body.is_paid === 'true' || req.body.is_paid === '1',
      added_by: req.user.id,
    });

    const studentUpdates = {};
    if (pickup.father_name && !student.father_name) {
      studentUpdates.father_name = pickup.father_name;
    }
    if (pickup.mother_name && !student.mother_name) {
      studentUpdates.mother_name = pickup.mother_name;
    }
    if (pickup.monthly_rehab_charges != null && student.monthly_fee == null) {
      studentUpdates.monthly_fee = pickup.monthly_rehab_charges;
    }
    if (Object.keys(studentUpdates).length) {
      await student.update(studentUpdates);
    }

    const full = await Pickup.findByPk(pickup.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapPickup(full), null, 201);
  } catch (err) {
    next(err);
  }
};

const updatePickup = async (req, res, next) => {
  try {
    const pickup = await Pickup.findByPk(req.params.id);
    if (!pickup) throw new AppError('Pickup not found', 404);
    const updates = { ...req.body };
    delete updates.student_id;
    delete updates.added_by;
    if (updates.is_paid !== undefined) {
      updates.is_paid =
        updates.is_paid === true || updates.is_paid === 'true' || updates.is_paid === '1';
    }
    if (updates.pickup_charges !== undefined) {
      updates.pickup_charges = parseMoneyField(updates.pickup_charges) ?? 0;
    }
    if (updates.monthly_rehab_charges !== undefined) {
      updates.monthly_rehab_charges = parseMoneyField(updates.monthly_rehab_charges);
    }
    ['requester_name', 'patient_name', 'father_name', 'mother_name', 'pickup_address', 'pincode', 'phone', 'pickup_members', 'pickup_incharge', 'guardian_name', 'notes'].forEach(
      (key) => {
        if (updates[key] !== undefined) updates[key] = parseOptionalText(updates[key]);
      }
    );
    await pickup.update(updates);
    const full = await Pickup.findByPk(pickup.id, {
      include: [{ model: User, as: 'addedByUser', attributes: ['id', 'name', 'role'] }],
    });
    return success(res, mapPickup(full));
  } catch (err) {
    next(err);
  }
};

const deletePickup = async (req, res, next) => {
  try {
    const pickup = await Pickup.findByPk(req.params.id);
    if (!pickup) throw new AppError('Pickup not found', 404);
    await pickup.destroy();
    return success(res, { id: Number(req.params.id), deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPickups,
  createPickup,
  updatePickup,
  deletePickup,
};
