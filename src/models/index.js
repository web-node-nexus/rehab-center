const User = require('./User');
const Student = require('./Student');
const InitialReport = require('./InitialReport');
const MonthlyRecord = require('./MonthlyRecord');
const DoctorVisit = require('./DoctorVisit');
const Payment = require('./Payment');
const FamilyMeeting = require('./FamilyMeeting');
const MonthlyPhoto = require('./MonthlyPhoto');

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

module.exports = {
  User,
  Student,
  InitialReport,
  MonthlyRecord,
  DoctorVisit,
  Payment,
  FamilyMeeting,
  MonthlyPhoto,
};
