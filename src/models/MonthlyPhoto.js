const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MonthlyPhoto = sequelize.define(
  'MonthlyPhoto',
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
    photo: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    taken_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    added_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'monthly_photos',
    indexes: [
      {
        unique: true,
        fields: ['student_id', 'year', 'month'],
        name: 'monthly_photos_student_period_unique',
      },
    ],
  }
);

module.exports = MonthlyPhoto;
