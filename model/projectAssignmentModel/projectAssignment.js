const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const ProjectAssignment = sequelize.define('ProjectAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'team_member',
  },
  assignedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  
  // Assignment Acceptance Workflow
  assignmentStatus: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Employee acceptance status for the project assignment'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when employee accepted the assignment'
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason provided by employee for rejecting assignment'
  },
  responseDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Deadline for employee to accept/reject assignment'
  },
  
  // Payment Allocation from Project Budget
  allocatedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Amount allocated to this employee from project budget'
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'USD',
  },
  paymentTerms: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Payment terms and conditions for this assignment'
  },
  paymentSchedule: {
    type: DataTypes.ENUM('project_completion', 'milestone_based', 'hourly', 'monthly', 'custom'),
    allowNull: true,
    defaultValue: 'project_completion',
  },
  
  // Work Submission and Verification
  workStatus: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'submitted', 'verified', 'rejected', 'revision_required'),
    allowNull: false,
    defaultValue: 'not_started',
    comment: 'Status of work completion and verification'
  },
  workStartedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  workSubmittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When employee marked work as completed'
  },
  workSubmissionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes provided by employee during work submission'
  },
  workVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When manager verified the completed work'
  },
  workVerifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Manager/Admin who verified the work'
  },
  verificationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Feedback from manager during verification'
  },
  workRejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for work rejection by manager'
  },
  revisionDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Deadline for employee to submit revised work'
  },
  
  performanceFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  // Additional Information
  deliverables: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of expected deliverables for this employee'
  },
  actualDeliverables: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of actual submitted deliverables [{name, url, submittedAt}]'
  },
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Specific responsibilities assigned to this employee'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'project_assignments',
  timestamps: true,
});

module.exports = ProjectAssignment;