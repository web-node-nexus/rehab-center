const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DoctorVisit = sequelize.define(
  'DoctorVisit',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    doctor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    bp: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pulse: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    spo2: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    symptoms_observed: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prescription_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prescription_pdf: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    prescription_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    next_visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: 'doctor_visits',
  }
);

module.exports = DoctorVisit;
