const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TeamMember = sequelize.define(
  'TeamMember',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sober_since: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    qualification: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    staff_id: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    duty: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    duty_other: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    added_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'team_members',
    indexes: [
      { fields: ['status'] },
      { fields: ['duty'] },
      { fields: ['staff_id'] },
      { fields: ['name'] },
    ],
  }
);

module.exports = TeamMember;
