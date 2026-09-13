const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InitialReport = sequelize.define(
  'InitialReport',
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
    report_title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    report_type: {
      type: DataTypes.ENUM('blood', 'x-ray', 'mri', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    pdf_file: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'initial_reports',
    updatedAt: false,
  }
);

module.exports = InitialReport;
