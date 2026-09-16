const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CashEntry = sequelize.define(
  'CashEntry',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('incoming', 'outgoing'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    party_name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    entry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM('cash', 'upi', 'bank', 'card', 'other'),
      allowNull: false,
      defaultValue: 'cash',
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
    tableName: 'cash_entries',
    indexes: [
      { fields: ['entry_date'] },
      { fields: ['type'] },
      { fields: ['party_name'] },
    ],
  }
);

module.exports = CashEntry;
