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
}, {
  tableName: 'project_assignments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'employee_id'],
    },
  ],
});

module.exports = ProjectAssignment;