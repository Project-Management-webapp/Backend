const { DataTypes } = require("sequelize");
const { sequelize } = require("../../mysqlConnection/dbConnection");

const ProjectAssignment = sequelize.define(
  "ProjectAssignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "team_member",
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
        model: "users",
        key: "id",
      },
    },

    estimatedHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
      comment: "Estimated total hours for project completion",
    },
    actualHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
      comment: "Actual hours spent on project",
    },

    estimatedConsumables: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    actualConsumables: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },

    estimatedMaterials: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    actualMaterials: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    rate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },

    // Payment Allocation from Project Budget
    allocatedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Amount allocated to this employee from project budget",
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "USD",
    },
    paymentTerms: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Payment terms and conditions for this assignment",
    },
    paymentSchedule: {
      type: DataTypes.ENUM(
        "project_completion",
        "milestone_based",
        "hourly",
        "monthly",
        "custom"
      ),
      allowNull: true,
      defaultValue: "project_completion",
    },

    // Work Submission and Verification
    workStatus: {
      type: DataTypes.ENUM("not_started", "in_progress", "submitted"),
      allowNull: false,
      defaultValue: "not_started",
      comment: "Status of work completion and verification",
    },
    workStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    workSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When employee marked work as completed",
    },
    // Additional Information
    deliverables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of expected deliverables for this employee",
    },
    actualDeliverables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "Array of actual submitted deliverables [{name, url, submittedAt}]",
    },
    responsibilities: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Specific responsibilities assigned to this employee",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "project_assignments",
    timestamps: true,
  }
);

module.exports = ProjectAssignment;
