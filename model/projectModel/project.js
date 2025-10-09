const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'on-hold', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  allocatedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  completionPercentage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true,
});

module.exports = Project;