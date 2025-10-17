const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticketId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique ticket identifier (e.g., TICKET-001)'
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Employee who raised the ticket'
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'technical_issue',
      'payment_issue',
      'project_concern',
      'workplace_issue',
      'account_access',
      'leave_request',
      'complaint',
      'suggestion',
      'other'
    ),
    allowNull: false,
    defaultValue: 'other',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of attachment files [{name, url, type, size, uploadedAt}]'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
    lastResponseAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
    closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  response:{
    type: DataTypes.JSON,
    allowNull: true,
  },
    message:{
    type: DataTypes.TEXT,
    allowNull: true,
  },

}, {
  tableName: 'support_tickets',
  timestamps: true,
});

module.exports = SupportTicket;
