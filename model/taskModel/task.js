const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'on-hold'),
    allowNull: false,
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  actualHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
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
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
});

module.exports = Task;