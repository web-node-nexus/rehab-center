const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FamilyMeeting = sequelize.define(
  'FamilyMeeting',
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
    meeting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    meeting_no: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 4 },
    },
    attendees: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    next_meeting_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    added_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'family_meetings',
    indexes: [{ fields: ['student_id'] }, { fields: ['meeting_date'] }],
  }
);

module.exports = FamilyMeeting;
