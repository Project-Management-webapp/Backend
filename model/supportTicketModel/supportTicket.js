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
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed', 'reopened'),
    allowNull: false,
    defaultValue: 'open',
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of attachment files [{name, url, type, size, uploadedAt}]'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Admin or Manager assigned to handle this ticket'
  },
  responses: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of responses [{userId, userName, message, timestamp, isInternal}]'
  },
  internalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes visible only to admin/manager'
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Final resolution description'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  closedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reopenedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reopenReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastResponseAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of last response for sorting'
  },
  relatedProjectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id',
    },
    comment: 'Related project if ticket is project-specific'
  },
  relatedPaymentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id',
    },
    comment: 'Related payment if ticket is payment-specific'
  },
  satisfactionRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
    comment: 'Employee satisfaction rating (1-5 stars)'
  },
  satisfactionFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'support_tickets',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['ticketId'] },
    { fields: ['employeeId'] },
    { fields: ['assignedTo'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['category'] },
    { fields: ['createdAt'] },
  ]
});

module.exports = SupportTicket;
