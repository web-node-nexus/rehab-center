const ROLES = ['admin', 'doctor', 'staff', 'psychologist'];

const ROLE_PERMISSIONS = {
  admin: 'all',
  doctor: [
    'home',
    'students',
    'student.basic',
    'student.medical',
    'doctorReport',
  ],
  psychologist: [
    'home',
    'students',
    'student.basic',
    'psychologistReport',
  ],
  staff: ['inquiries', 'students', 'student.basic', 'cashbook'],
};

const TAB_PERMISSIONS = {
  Home: 'home',
  Students: 'students',
  Inquiries: 'inquiries',
  Payments: 'payments',
  Settings: 'settings',
};

const can = (role, permission) => {
  if (!role || !permission) return false;
  if (permission === 'settings') return true;
  const granted = ROLE_PERMISSIONS[role];
  if (granted === 'all') return true;
  return Array.isArray(granted) && granted.includes(permission);
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
  if (!data || role === 'admin') return data;
  if (role === 'staff') return pickFields(data, BASIC_STUDENT_FIELDS);
  if (role === 'psychologist') {
    return {
      ...pickFields(data, BASIC_STUDENT_FIELDS),
      psychologist_report: data.psychologist_report || null,
    };
  }
  const next = { ...data };
  delete next.agreed_fee;
  delete next.monthly_fee;
  delete next.admission_fee;
  delete next.duration_months;
  delete next.fee_ledger;
  delete next.payments;
  delete next.payment_totals;
  delete next.pickups;
  delete next.family_meetings;
  delete next.monthly_photos;
  delete next.psychologist_report;
  delete next.initial_reports;
  delete next.monthly_records;
  if (next.counts) {
    next.counts = {
      initial_reports: 0,
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
};
