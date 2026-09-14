const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define(
  'Payment',
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    for_month: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: { min: 1, max: 12 },
    },
    for_year: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM('cash', 'upi', 'bank', 'card', 'other'),
      allowNull: false,
      defaultValue: 'cash',
    },
    receipt_no: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    receipt_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    received_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'payments',
    indexes: [
      { fields: ['student_id'] },
      { fields: ['payment_date'] },
      { fields: ['for_year', 'for_month'] },
    ],
  }
);

module.exports = Payment;
