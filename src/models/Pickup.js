const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pickup = sequelize.define(
  'Pickup',
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
    form_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    requester_name: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    patient_name: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    father_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    mother_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    pickup_charges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    monthly_rehab_charges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    starting_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    pickup_members: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pickup_incharge: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    guardian_name: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    added_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'pickups',
    indexes: [{ fields: ['student_id'] }, { fields: ['form_date'] }],
  }
);

module.exports = Pickup;
