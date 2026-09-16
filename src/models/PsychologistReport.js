const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PsychologistReport = sequelize.define(
  'PsychologistReport',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    first_time_consuming: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reasons_inability_to_quit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reasons_relapsing: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type_of_problem: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    mental_state: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cause_of_addiction: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    added_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'psychologist_reports',
  }
);

module.exports = PsychologistReport;
