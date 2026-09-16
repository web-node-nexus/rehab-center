const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeviceSession = sequelize.define(
  'DeviceSession',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    device_name: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    platform: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    app_version: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'device_sessions',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['device_id'] },
      { fields: ['is_active'] },
      { unique: true, fields: ['user_id', 'device_id'] },
    ],
  }
);

module.exports = DeviceSession;
