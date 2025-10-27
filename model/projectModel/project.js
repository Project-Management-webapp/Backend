const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Basic Information
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  projectType: {
    type: DataTypes.ENUM('quoted','time and materials','other'),
    allowNull: true,
    defaultValue: 'other',
  },
  customProjectType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Custom project type when projectType is "other"'
  },
  // Timeline Information
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  actualStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Actual date when project work started'
  },
  actualEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Actual date when project was completed'
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Estimated total hours for project completion'
  },
  actualHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Actual hours spent on project'
  },
    estimatedConsumables: {
    type: DataTypes.JSON,
    allowNull: false,
  },
    actualConsumables: {
    type: DataTypes.JSON,
    allowNull: false,
  },

  
  // Status and Progress
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'on-hold', 'cancelled', 'archived'),
    allowNull: false,
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  // Financial Information
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  allocatedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Amount allocated to employees'
  },
  spentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Total amount spent on project'
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'USD',
  },
  billingType: {
    type: DataTypes.ENUM('fixed_price', 'hourly', 'monthly_retainer', 'milestone_based', 'other'),
    allowNull: true,
    defaultValue: 'fixed_price',
  },
  // Client Information
  companyName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'company name'
  },
  companyEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  companyPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },


  referenceLinks: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of additional reference links [{title, url, type}]'
  },
  
  // Milestones
  milestones: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of project milestones [{name, description, deadline, status, completedDate}]'
  },
  
  // Risks and Issues
  risks: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of identified risks [{description, severity, mitigation, status}]'
  },
  issues: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of current issues [{description, priority, assignedTo, status}]'
  },
  
  // Quality Assurance
  testingStatus: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'failed'),
    allowNull: true,
  },
  // Additional Information
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes and remarks'
  },
  
  // Team Information
  teamSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Number of team members'
  },
  teamLead: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User ID of team lead'
  },
  
  // Visibility and Access
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'internal'),
    allowNull: true,
    defaultValue: 'internal',
  },
  
  // Creator Information
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
});

module.exports = Project;