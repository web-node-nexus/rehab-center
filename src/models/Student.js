const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    profile_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    scars_from_injury: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    blood_group: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    alternate_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aadhar_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    date_of_joining: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    admission_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    known_allergies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    past_medical_history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    current_medications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergency_contact_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    emergency_contact_relation: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    emergency_contact_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    family_member_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    family_member_relation: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    family_member_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    family_member_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    family_aadhar_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    visiting_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    visiting_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visiting_phone: {
      type: DataTypes.STRING(30),
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
    agreed_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    monthly_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    admission_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    duration_months: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    referred_by: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'discharged', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    discharge_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    discharge_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'students',
  }
);

module.exports = Student;
