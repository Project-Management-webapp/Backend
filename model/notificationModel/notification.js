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
    type: DataTypes.ENUM('task_assignment', 'project_assignment', 'deadline_reminder', 'payment', 'general', 'system', 'milestone_reminder'),
    allowNull: false,
    defaultValue: 'general',
  },
  targetRole: {
    type: DataTypes.ENUM('employee', 'manager', 'admin', 'all_managers', 'all_admins'),
    allowNull: true,
    comment: 'If set to all_managers or all_admins, notification is visible to all users with that role',
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of related entity (project, payment, etc.)',
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of related entity (project, payment, task, etc.)',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional contextual data for the notification',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;