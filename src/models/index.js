const User = require('./User');
const Student = require('./Student');
const InitialReport = require('./InitialReport');
const MonthlyRecord = require('./MonthlyRecord');
const DoctorVisit = require('./DoctorVisit');
const Payment = require('./Payment');
const FamilyMeeting = require('./FamilyMeeting');
const MonthlyPhoto = require('./MonthlyPhoto');
const Inquiry = require('./Inquiry');
const Pickup = require('./Pickup');
const PsychologistReport = require('./PsychologistReport');
const CashEntry = require('./CashEntry');
const DeviceSession = require('./DeviceSession');
const TeamMember = require('./TeamMember');

Student.hasMany(InitialReport, {
  foreignKey: 'student_id',
  as: 'initial_reports',
  onDelete: 'CASCADE',
});
InitialReport.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Student.hasMany(MonthlyRecord, {
  foreignKey: 'student_id',
  as: 'monthly_records',
  onDelete: 'CASCADE',
});
MonthlyRecord.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
MonthlyRecord.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(MonthlyRecord, { foreignKey: 'added_by', as: 'monthly_records' });

Student.hasMany(DoctorVisit, {
  foreignKey: 'student_id',
  as: 'doctor_visits',
  onDelete: 'CASCADE',
});
DoctorVisit.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
DoctorVisit.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });
User.hasMany(DoctorVisit, { foreignKey: 'doctor_id', as: 'doctor_visits' });

Student.hasMany(Payment, {
  foreignKey: 'student_id',
  as: 'payments',
  onDelete: 'CASCADE',
});
Payment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Payment.belongsTo(User, { foreignKey: 'received_by', as: 'receivedByUser' });
User.hasMany(Payment, { foreignKey: 'received_by', as: 'payments' });

Student.hasMany(FamilyMeeting, {
  foreignKey: 'student_id',
  as: 'family_meetings',
  onDelete: 'CASCADE',
});
FamilyMeeting.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
FamilyMeeting.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(FamilyMeeting, { foreignKey: 'added_by', as: 'family_meetings' });

Student.hasMany(MonthlyPhoto, {
  foreignKey: 'student_id',
  as: 'monthly_photos',
  onDelete: 'CASCADE',
});
MonthlyPhoto.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
MonthlyPhoto.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(MonthlyPhoto, { foreignKey: 'added_by', as: 'monthly_photos' });

Inquiry.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(Inquiry, { foreignKey: 'added_by', as: 'inquiries' });

Student.hasMany(Pickup, {
  foreignKey: 'student_id',
  as: 'pickups',
  onDelete: 'CASCADE',
});
Pickup.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Pickup.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(Pickup, { foreignKey: 'added_by', as: 'pickups' });

Student.hasOne(PsychologistReport, {
  foreignKey: 'student_id',
  as: 'psychologist_report',
  onDelete: 'CASCADE',
});
PsychologistReport.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
PsychologistReport.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(PsychologistReport, { foreignKey: 'added_by', as: 'psychologist_reports' });

CashEntry.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(CashEntry, { foreignKey: 'added_by', as: 'cash_entries' });

DeviceSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(DeviceSession, { foreignKey: 'user_id', as: 'device_sessions' });

TeamMember.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });
User.hasMany(TeamMember, { foreignKey: 'added_by', as: 'team_members' });

module.exports = {
  User,
  Student,
  InitialReport,
  MonthlyRecord,
  DoctorVisit,
  Payment,
  FamilyMeeting,
  MonthlyPhoto,
  Inquiry,
  Pickup,
  PsychologistReport,
  CashEntry,
  DeviceSession,
  TeamMember,
};
