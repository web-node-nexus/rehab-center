const ROLES = ['admin', 'doctor', 'staff', 'psychologist'];

/**
 * HARD role matrix — staff MUST be able to list/view students (basic) + inquiries.
 * Admin = everything. Doctor = medical + visits. Psychologist = psych report.
 */
const ROLE_PERMISSIONS = {
  admin: 'all',
  doctor: [
    'home',
    'students',
    'student.basic',
    'student.medical',
    'doctorReport',
    'btReport',
  ],
  psychologist: [
    'home',
    'students',
    'student.basic',
    'psychologistReport',
  ],
  // Staff: enquiry + students + admit + doctor checkup + B.T / blood reports. No payments.
  staff: [
    'inquiries',
    'students',
    'student.basic',
    'students.admit',
    'doctorReport',
    'btReport',
  ],
};

const TAB_PERMISSIONS = {
  Home: 'home',
  Students: 'students',
  Inquiries: 'inquiries',
  Payments: 'payments',
  Settings: 'settings',
};

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase();

const can = (role, permission) => {
  const r = normalizeRole(role);
  const p = String(permission || '').trim();
  if (!r || !p) return false;
  if (p === 'settings') return true;
  if (r === 'admin') return true;

  // Explicit hard checks so staff/doctor/psych never break if arrays drift
  if (r === 'staff') {
    return (
      p === 'inquiries' ||
      p === 'students' ||
      p === 'student.basic' ||
      p === 'students.admit' ||
      p === 'doctorReport' ||
      p === 'btReport'
    );
  }
  if (r === 'doctor') {
    return (
      p === 'home' ||
      p === 'students' ||
      p === 'student.basic' ||
      p === 'student.medical' ||
      p === 'doctorReport' ||
      p === 'btReport'
    );
  }
  if (r === 'psychologist') {
    return (
      p === 'home' ||
      p === 'students' ||
      p === 'student.basic' ||
      p === 'psychologistReport'
    );
  }

  const granted = ROLE_PERMISSIONS[r];
  if (granted === 'all') return true;
  return Array.isArray(granted) && granted.includes(p);
};

const DENIED_MESSAGE = 'You are not authorized for this action';

const BASIC_STUDENT_FIELDS = [
  'id',
  'full_name',
  'profile_image',
  'date_of_birth',
  'age',
  'gender',
  'phone_number',
  'alternate_phone',
  'address',
  'date_of_joining',
  'status',
  'father_name',
  'mother_name',
  'family_member_name',
  'family_member_relation',
  'family_member_phone',
  'family_member_address',
  'emergency_contact_name',
  'emergency_contact_relation',
  'emergency_contact_phone',
  'admitted_by',
  'pickup_by',
  'created_at',
  'updated_at',
];

const pickFields = (data, keys) => {
  const out = {};
  keys.forEach((key) => {
    if (data[key] !== undefined) out[key] = data[key];
  });
  return out;
};

const shapeStudentForRole = (data, role) => {
  const r = normalizeRole(role);
  if (!data || r === 'admin') return data;
  if (r === 'staff') {
    // Staff: admit + doctor visits + B.T reports; hide payments / psych / monthly modules
    const next = { ...data };
    delete next.payments;
    delete next.payment_totals;
    delete next.fee_ledger;
    delete next.agreed_fee;
    delete next.monthly_fee;
    delete next.admission_fee;
    delete next.pickup_charges;
    delete next.pickups;
    delete next.family_meetings;
    delete next.monthly_photos;
    delete next.psychologist_report;
    delete next.monthly_records;
    if (next.counts) {
      next.counts = {
        initial_reports: next.counts.initial_reports || 0,
        monthly_records: 0,
        doctor_visits: next.counts.doctor_visits || 0,
        payments: 0,
        family_meetings: 0,
        monthly_photos: 0,
        pickups: 0,
      };
    }
    return next;
  }
  if (r === 'psychologist') {
    return {
      ...pickFields(data, BASIC_STUDENT_FIELDS),
      psychologist_report: data.psychologist_report || null,
      counts: {
        initial_reports: 0,
        monthly_records: 0,
        doctor_visits: 0,
        payments: 0,
        family_meetings: 0,
        monthly_photos: 0,
        pickups: 0,
      },
    };
  }
  // doctor: medical + visits + blood/BT reports, never payments/fees
  const next = { ...data };
  delete next.agreed_fee;
  delete next.monthly_fee;
  delete next.admission_fee;
  delete next.duration_months;
  delete next.fee_ledger;
  delete next.payments;
  delete next.payment_totals;
  delete next.pickup_charges;
  delete next.pickups;
  delete next.family_meetings;
  delete next.monthly_photos;
  delete next.psychologist_report;
  delete next.monthly_records;
  if (next.counts) {
    next.counts = {
      initial_reports: next.counts.initial_reports || 0,
      monthly_records: 0,
      doctor_visits: next.counts.doctor_visits || 0,
      payments: 0,
      family_meetings: 0,
      monthly_photos: 0,
      pickups: 0,
    };
  }
  return next;
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  TAB_PERMISSIONS,
  can,
  DENIED_MESSAGE,
  shapeStudentForRole,
  normalizeRole,
};
