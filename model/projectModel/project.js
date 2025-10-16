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
    type: DataTypes.ENUM('web_development', 'mobile_app', 'desktop_app', 'api_development', 'saas', 'ecommerce', 'custom_software', 'maintenance', 'consulting', 'other'),
    allowNull: true,
    defaultValue: 'web_development',
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Project category or domain (e.g., Healthcare, Finance, Education)'
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
  clientName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Client or company name'
  },
  clientEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  clientPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  clientCompany: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // Technical Specifications
  technologies: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of technologies used (e.g., ["React", "Node.js", "MongoDB"])'
  },
  frameworks: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of frameworks used'
  },
  programmingLanguages: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of programming languages'
  },
  database: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Database system used (e.g., MySQL, PostgreSQL, MongoDB)'
  },
  cloudProvider: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Cloud service provider (e.g., AWS, Azure, GCP)'
  },
  architecture: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'System architecture (e.g., Microservices, Monolithic, Serverless)'
  },
  // Repository and Version Control
  repositoryUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Git repository URL (GitHub, GitLab, Bitbucket)'
  },
  repositoryType: {
    type: DataTypes.ENUM('github', 'gitlab', 'bitbucket', 'azure_devops', 'other'),
    allowNull: true,
  },
  // Reference Links
  productionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Live production URL'
  },
  stagingUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Staging environment URL'
  },
  developmentUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Development environment URL'
  },
  documentationUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Project documentation URL'
  },
  apiDocumentationUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'API documentation URL (Swagger, Postman)'
  },
  figmaUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Figma design URL'
  },
  jiraUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'JIRA project URL'
  },
  slackChannel: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Slack channel for project communication'
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
  testCoverage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Test coverage percentage'
  },
  qaApprovalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'not_required'),
    allowNull: true,
    defaultValue: 'pending',
  },
  
  // Deployment Information
  deploymentStatus: {
    type: DataTypes.ENUM('not_deployed', 'dev', 'staging', 'production', 'all_environments'),
    allowNull: true,
  },
  lastDeploymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deploymentFrequency: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., Daily, Weekly, Bi-weekly'
  },
  cicdPipeline: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'CI/CD pipeline URL or name'
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