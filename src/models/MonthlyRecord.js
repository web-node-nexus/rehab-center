const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MonthlyRecord = sequelize.define(
  'MonthlyRecord',
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
    month: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    year: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    test_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    test_result_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pdf_report: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    weight_at_test: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    bp_reading: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pulse_reading: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
    },
    added_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'monthly_records',
  }
);

module.exports = MonthlyRecord;
