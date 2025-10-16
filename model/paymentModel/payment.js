const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'project_assignments',
      key: 'id',
    },
    comment: 'Related project assignment for project-based payments'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'USD',
  },
  paymentType: {
    type: DataTypes.ENUM('salary', 'bonus', 'project_payment', 'overtime', 'incentive', 'reimbursement'),
    allowNull: false,
    defaultValue: 'salary',
  },
  paymentMethod: {
    type: DataTypes.ENUM('bank_transfer', 'cash', 'check', 'digital_wallet', 'upi', 'paypal', 'other'),
    allowNull: false,
    defaultValue: 'bank_transfer',
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold'),
    allowNull: false,
    defaultValue: 'pending',
  },
  // Payment Request Workflow
  requestStatus: {
    type: DataTypes.ENUM('not_requested', 'requested', 'approved', 'rejected', 'paid', 'confirmed'),
    allowNull: false,
    defaultValue: 'not_requested',
    comment: 'Status of payment request workflow'
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When employee requested payment'
  },
  requestNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes provided by employee with payment request'
  },
  // Approval Workflow
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Manager/Admin who approved the payment'
  },
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for payment request rejection'
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bank transaction ID or payment reference number'
  },
  transactionProofLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL of transaction Link'
  },

  // Employee Confirmation
  employeeConfirmation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether employee confirmed receiving payment'
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When employee confirmed payment receipt'
  },
  confirmationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes provided by employee during confirmation'
  },


}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;