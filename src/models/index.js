const User = require('./User');
const Student = require('./Student');
const InitialReport = require('./InitialReport');
const MonthlyRecord = require('./MonthlyRecord');
const DoctorVisit = require('./DoctorVisit');

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

module.exports = {
  User,
  Student,
  InitialReport,
  MonthlyRecord,
  DoctorVisit,
};
