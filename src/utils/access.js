const ROLES = ['admin', 'doctor', 'staff', 'psychologist'];

/**
 * Role matrix:
 * - admin: everything (incl. payments)
 * - staff: everything EXCEPT payments / cashbook / accounts.manage
 * - doctor: medical + doctor visits + BT reports (no payments)
 * - psychologist: psych report (no payments)
 */
const STAFF_DENIED = new Set(['payments', 'cashbook', 'accounts.manage']);

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
  staff: [
    'home',
    'students',
    'student.basic',
    'student.medical',
    'students.manage',
    'students.admit',
    'inquiries',
    'doctorReport',
    'btReport',
    'monthlyTests',
    'psychologistReport',
    'familyMeetings',
    'monthlyPhotos',
    'pickups',
    'team.manage',
    'settings',
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

  // Money modules — admin only (never staff/doctor/psych)
  if (p === 'payments' || p === 'cashbook' || p === 'accounts.manage') {
    return false;
  }

  if (r === 'staff') {
    return !STAFF_DENIED.has(p);
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

const stripPaymentFields = (data) => {
  const next = { ...data };
  delete next.payments;
  delete next.payment_totals;
  delete next.fee_ledger;
  delete next.agreed_fee;
  delete next.monthly_fee;
  delete next.admission_fee;
  delete next.duration_months;
  delete next.pickup_charges;
  if (next.counts) {
    next.counts = {
      ...next.counts,
      payments: 0,
    };
  }
  return next;
};

const shapeStudentForRole = (data, role) => {
  const r = normalizeRole(role);
  if (!data || r === 'admin') return data;

  if (r === 'staff') {
    // Staff sees everything except payment / fee money fields
    return stripPaymentFields(data);
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
  const next = stripPaymentFields(data);
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
  STAFF_DENIED,
  can,
  DENIED_MESSAGE,
  shapeStudentForRole,
  normalizeRole,
};
