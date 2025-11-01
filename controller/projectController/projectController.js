const Project = require("../../model/projectModel/project");
const ProjectAssignment = require("../../model/projectAssignmentModel/projectAssignment");
const User = require("../../model/userModel/user");
const { Op } = require("sequelize");

// Helper function to calculate budget
// Formula: budget = estimatedHours * rate + estimatedConsumables + estimatedMaterials
const calculateBudget = (
  estimatedHours,
  rate,
  estimatedConsumables,
  estimatedMaterials
) => {
  const hours = parseFloat(estimatedHours) || 0;
  const hourlyRate = parseFloat(rate) || 0;
  const consumables = parseFloat(estimatedConsumables) || 0;
  const materials = parseFloat(estimatedMaterials) || 0;

  const totalBudget = hours * hourlyRate + consumables + materials;
  return totalBudget.toFixed(2);
};

const handleCreateProject = async (req, res) => {
  try {
    const {
      // Basic Information
      name,
      description,
      projectType,
      customProjectType,

      // Timeline Information
      startDate,
      deadline,
      //actualStartDate,
      //actualEndDate,
      estimatedHours,
      //actualHours,
      estimatedConsumables,
      //actualConsumables,

      estimatedMaterials,
      rate,
      // Status and Progress
      status,
      priority,

      // Financial Information
      // budget, // Budget is auto-calculated, not accepted from user input
      allocatedAmount,
      spentAmount,
      currency,
      billingType,

      // Client Information
      companyName,
      companyEmail,
      companyPhone,

      // Reference Links
      referenceLinks,

      // Project Management
      milestones,

      // Risks and Issues
      risks,
      issues,

      // Quality Assurance
      testingStatus,

      // Additional Information
      notes,

      // Team Information
      teamSize,
      teamLead,

      // Visibility and Access
      visibility,
    } = req.body;

    const createdBy = req.user.id;

    // Validation: if projectType is 'other', customProjectType is required
    if (projectType === "other" && !customProjectType) {
      return res.status(400).json({
        success: false,
        message: "customProjectType is required when projectType is 'other'",
      });
    }

    // Auto-calculate budget
    const calculatedBudget = calculateBudget(
      estimatedHours,
      rate,
      estimatedConsumables,
      estimatedMaterials
    );

    const newProject = await Project.create({
      // Basic Information
      name,
      description: description || null,
      projectType: projectType || "other",
      customProjectType: projectType === "other" ? customProjectType : null,

      // Timeline Information
      startDate,
      deadline,
      estimatedHours: estimatedHours || 0,
      estimatedConsumables: estimatedConsumables || 0,
      estimatedMaterials: estimatedMaterials || 0,
      rate: rate || 0.0,
      // Note: actualStartDate, actualEndDate, actualHours, actualConsumables, actualMaterials
      // are not set during creation - they will be updated later during project execution

      // Status and Progress
      status: status || "pending",
      priority: priority || "medium",

      // Financial Information
      budget: calculatedBudget,
      allocatedAmount: allocatedAmount || 0,
      spentAmount: spentAmount || 0,
      currency: currency || "USD",
      billingType: billingType || "fixed_price",

      // Client Information
      companyName: companyName || null,
      companyEmail: companyEmail || null,
      companyPhone: companyPhone || null,

      // Reference Links
      referenceLinks: referenceLinks || null,

      // Project Management
      milestones: milestones || null,

      // Risks and Issues
      risks: risks || null,
      issues: issues || null,

      // Quality Assurance
      testingStatus: testingStatus || null,

      // Additional Information
      notes: notes || null,

      // Team Information
      teamSize: teamSize || null,
      teamLead:
        teamLead && !isNaN(parseInt(teamLead)) ? parseInt(teamLead) : null,

      // Visibility and Access
      visibility: visibility || "internal",

      // Creator
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleGetAllProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    const whereConditions = {};

    if (status) whereConditions.status = status;
    if (priority) whereConditions.priority = priority;
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // If employee, show only assigned projects
    if (req.user.role === "employee") {
      const assignments = await ProjectAssignment.findAll({
        where: { employeeId: req.user.id, isActive: true },
        attributes: ["projectId"],
      });
      const projectIds = assignments.map((a) => a.projectId);
      whereConditions.id = { [Op.in]: projectIds };
    }
    const projects = await Project.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "fullName", "email", "role"],
        },
        {
          model: ProjectAssignment,
          as: "assignments",
          include: [
            {
              model: User,
              as: "employee",
              attributes: ["id", "fullName", "email", "position"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: {
        projects,
      },
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleGetProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "fullName", "email", "role", "profileImage"],
        },
        {
          model: ProjectAssignment,
          as: "assignments",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "employee",
              attributes: [
                "id",
                "fullName",
                "email",
                "position",
                "department",
                "profileImage",
              ],
            },
          ],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if employee is authorized to view this project
    if (req.user.role === "employee") {
      const isAssigned = await ProjectAssignment.findOne({
        where: {
          projectId,
          employeeId: req.user.id,
          isActive: true,
        },
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this project",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleUpdateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      // Basic Information
      name,
      description,
      projectType,
      customProjectType,

      // Timeline Information
      startDate,
      deadline,
      actualStartDate,
      actualEndDate,
      estimatedHours,
      actualHours,
      estimatedConsumables,
      actualConsumables,
      actualMaterials,
      estimatedMaterials,
      rate,

      // Status and Progress
      status,
      priority,

      // Financial Information
      budget,
      allocatedAmount,
      spentAmount,
      currency,
      billingType,

      // Client Information
      companyName,
      companyEmail,
      companyPhone,

      // Reference Links
      referenceLinks,

      // Project Management
      milestones,

      // Risks and Issues
      risks,
      issues,

      // Quality Assurance
      testingStatus,

      // Additional Information
      notes,

      // Team Information
      teamSize,
      teamLead,

      // Visibility and Access
      visibility,
    } = req.body;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Validation: if projectType is 'other', customProjectType is required
    if (projectType === "other" && !customProjectType) {
      return res.status(400).json({
        success: false,
        message: "customProjectType is required when projectType is 'other'",
      });
    }

    const updateData = {};

    // Basic Information
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (projectType !== undefined) {
      updateData.projectType = projectType;
      // Clear customProjectType if projectType is not 'other'
      if (projectType !== "other") {
        updateData.customProjectType = null;
      }
    }
    if (customProjectType !== undefined && projectType === "other") {
      updateData.customProjectType = customProjectType;
    }

    // Timeline Information
    if (startDate !== undefined) updateData.startDate = startDate;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (actualStartDate !== undefined)
      updateData.actualStartDate = actualStartDate;
    if (actualEndDate !== undefined) updateData.actualEndDate = actualEndDate;
    if (estimatedHours !== undefined)
      updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (estimatedConsumables !== undefined)
      updateData.estimatedConsumables = estimatedConsumables;
    if (actualConsumables !== undefined)
      updateData.actualConsumables = actualConsumables;
    if (estimatedMaterials !== undefined)
      updateData.estimatedMaterials = estimatedMaterials;
    if (actualMaterials !== undefined)
      updateData.actualMaterials = actualMaterials;
    if (rate !== undefined) updateData.rate = rate;

    // Auto-calculate budget if any of the budget-related fields are updated
    const shouldRecalculateBudget =
      estimatedHours !== undefined ||
      rate !== undefined ||
      estimatedConsumables !== undefined ||
      estimatedMaterials !== undefined;

    if (shouldRecalculateBudget) {
      const currentEstimatedHours =
        estimatedHours !== undefined ? estimatedHours : project.estimatedHours;
      const currentRate = rate !== undefined ? rate : project.rate;
      const currentEstimatedConsumables =
        estimatedConsumables !== undefined
          ? estimatedConsumables
          : project.estimatedConsumables;
      const currentEstimatedMaterials =
        estimatedMaterials !== undefined
          ? estimatedMaterials
          : project.estimatedMaterials;

      updateData.budget = calculateBudget(
        currentEstimatedHours,
        currentRate,
        currentEstimatedConsumables,
        currentEstimatedMaterials
      );
    }

    // Status and Progress
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    // Financial Information
    // Note: budget is auto-calculated, not manually updated
    if (allocatedAmount !== undefined)
      updateData.allocatedAmount = allocatedAmount;
    if (spentAmount !== undefined) updateData.spentAmount = spentAmount;
    if (currency !== undefined) updateData.currency = currency;
    if (billingType !== undefined) updateData.billingType = billingType;

    // Client Information
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
    if (companyPhone !== undefined) updateData.companyPhone = companyPhone;

    // Reference Links
    if (referenceLinks !== undefined)
      updateData.referenceLinks = referenceLinks;

    // Project Management
    if (milestones !== undefined) updateData.milestones = milestones;

    // Risks and Issues
    if (risks !== undefined) updateData.risks = risks;
    if (issues !== undefined) updateData.issues = issues;

    // Quality Assurance
    if (testingStatus !== undefined) updateData.testingStatus = testingStatus;

    // Additional Information
    if (notes !== undefined) updateData.notes = notes;

    // Team Information
    if (teamSize !== undefined) updateData.teamSize = teamSize;
    if (teamLead !== undefined) updateData.teamLead = teamLead;

    // Visibility and Access
    if (visibility !== undefined) updateData.visibility = visibility;

    await project.update(updateData);

    const updatedProject = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleDeleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.destroy();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleGetMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const assignments = await ProjectAssignment.findAll({
      where: {
        employeeId: userId,
        isActive: true,
      },
      include: [
        {
          model: Project,
          as: "project",
          include: [
            {
              model: User,
              as: "creator",
              attributes: ["id", "fullName", "email"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Your projects retrieved successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Get my projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Mark project as completed
 */
const handleMarkProjectAsCompleted = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find the project
    const project = await Project.findOne({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project is already completed
    if (project.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Project is already marked as completed",
      });
    }

    // Get all project assignments to calculate actual totals
    const assignments = await ProjectAssignment.findAll({
      where: { 
        projectId: projectId,
        isActive: true
      }
    });

    // Calculate total actual hours, materials, and consumables from all assignments
    let totalActualHours = 0;
    let totalActualMaterials = 0;
    let totalActualConsumables = 0;

    assignments.forEach(assignment => {
      totalActualHours += parseFloat(assignment.actualHours) || 0;
      totalActualMaterials += parseFloat(assignment.actualMaterials) || 0;
      totalActualConsumables += parseFloat(assignment.actualConsumables) || 0;
    });

    // Update project status to completed and set actual values
    await project.update({
      status: "completed",
      actualEndDate: new Date(),
      actualHours: totalActualHours,
      actualMaterials: totalActualMaterials,
      actualConsumables: totalActualConsumables,
    });

    // // Optionally, you can also update all project assignments to completed
    // await ProjectAssignment.update(
    //   { workStatus: 'completed' },
    //   {
    //     where: {
    //       projectId: projectId,
    //       workStatus: { [Op.ne]: 'completed' }
    //     }
    //   }
    // );

    return res.status(200).json({
      success: true,
      message: "Project marked as completed successfully",
      data: {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        actualEndDate: project.actualEndDate,
        actualHours: project.actualHours,
        actualMaterials: project.actualMaterials,
        actualConsumables: project.actualConsumables,
      },
    });
  } catch (error) {
    console.error("Mark project as completed error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  handleCreateProject,
  handleGetAllProjects,
  handleGetProjectById,
  handleUpdateProject,
  handleDeleteProject,
  handleGetMyProjects,
  handleMarkProjectAsCompleted,
};
