const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Basic Information
  employeeId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  fullName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  alternateEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  
  // Role and Position Information
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'team_lead', 'employee', 'intern'),
    allowNull: false,
    defaultValue: 'employee',
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  level: {
    type: DataTypes.ENUM('junior', 'mid', 'senior', 'lead', 'principal'),
    allowNull: true,
  },
  managerId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  
  // Contact Information
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  alternatePhone: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  emergencyContactName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  emergencyContactPhone: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  emergencyContactRelation: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  
  // Address Information
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  
  // Personal Information
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true,
  },
  maritalStatus: {
    type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
    allowNull: true,
  },
  nationality: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  
  // Professional Information
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  contractType: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern', 'consultant'),
    allowNull: true,
    defaultValue: 'full_time',
  },
  workLocation: {
    type: DataTypes.ENUM('office', 'remote', 'hybrid'),
    allowNull: true,
    defaultValue: 'office',
  },
  workSchedule: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  probationEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  confirmationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  // Financial Information
  baseSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'USD',
  },
  payrollId: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bankAccountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  bankRoutingNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  socialSecurityNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  
  // Skills and Education
  skills: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  education: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  certifications: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  languages: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  
  // Performance and Rating
  performanceRating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5,
    },
  },
  lastReviewDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nextReviewDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  
  // System and Status Information
  profileImage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated', 'on_leave', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  accountLockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // Leave and Time Off
  totalLeaveBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  usedLeaveBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sickLeaveBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  
  // Additional Information
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'UTC',
  },
  
  // Termination Information
  terminationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  terminationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  

  
  // Verification Status
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
 },
   isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
 },

}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;