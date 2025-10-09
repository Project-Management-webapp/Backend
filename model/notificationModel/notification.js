const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('task_assignment', 'project_assignment', 'deadline_reminder', 'payment', 'general', 'system'),
    allowNull: false,
    defaultValue: 'general',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  relatedType: {
    type: DataTypes.ENUM('project', 'task', 'payment', 'user'),
    allowNull: true,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
});

module.exports = Notification;