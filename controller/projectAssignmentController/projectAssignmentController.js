const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const Project = require('../../model/projectModel/project');
const User = require('../../model/userModel/user');
const Notification = require('../../model/notificationModel/notification');

const handleAssignEmployeeToProject = async (req, res) => {
  try {
    const { projectId, employeeId, role, allocatedAmount, paymentSchedule, paymentTerms, responsibilities, deliverables } = req.body;
    const assignedBy = req.user.id;

    if (!projectId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Employee ID are required"
      });
    }

    if (!allocatedAmount || allocatedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Allocated amount is required and must be greater than 0"
      });
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Check budget availability
    const totalAllocated = await ProjectAssignment.sum('allocatedAmount', {
      where: { 
        projectId,
        isActive: true
      }
    }) || 0;

    const remainingBudget = parseFloat(project.budget) - parseFloat(totalAllocated);
    
    if (parseFloat(allocatedAmount) > remainingBudget) {
      return res.status(400).json({
        success: false,
        message: `Insufficient budget. Available: ${remainingBudget}, Requested: ${allocatedAmount}`
      });
    }

    // Check if employee exists
    const employee = await User.findOne({
      where: { 
        id: employeeId,
        role: ['employee', 'team_lead', 'intern']
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if already assigned
    const existingAssignment = await ProjectAssignment.findOne({
      where: { 
        projectId, 
        employeeId,
        isActive: true
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "Employee is already assigned to this project"
      });
    }


    const assignment = await ProjectAssignment.create({
      projectId,
      employeeId,
      role: role || 'team_member',
      assignedBy,
      assignedDate: new Date(),
      allocatedAmount,
      currency: project.currency || 'USD',
      paymentSchedule: paymentSchedule || 'project_completion',
      paymentTerms,
      responsibilities,
      deliverables,
      assignmentStatus: 'pending',
      workStatus: 'in_progress',
    });

    // Update project allocated amount
    project.allocatedAmount = parseFloat(project.allocatedAmount || 0) + parseFloat(allocatedAmount);
    await project.save();

    // Create notification for employee
    await Notification.create({
      userId: employeeId,
      title: 'New Project Assignment',
      message: `You have been assigned to project: ${project.name}. Allocated Amount: ${allocatedAmount} ${project.currency}. Please start working on it.`,
      type: 'project_assignment',
      relatedId: projectId,
      relatedType: 'project',
      priority: 'high'
    });

    const assignmentWithDetails = await ProjectAssignment.findOne({
      where: { id: assignment.id },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'deadline']
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Employee assigned to project successfully",
      data: assignmentWithDetails
    });

  } catch (error) {
    console.error("Assign employee to project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const handleGetProjectAssignments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const assignments = await ProjectAssignment.findAll({
      where: { 
        projectId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position', 'department', 'phone']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['assignedDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Project assignments retrieved successfully",
      data: {
        project: {
          id: project.id,
          name: project.name,
          status: project.status
        },
        assignments,
        totalAssignments: assignments.length
      }
    });

  } catch (error) {
    console.error("Get project assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const handleRemoveEmployeeFromProject = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await ProjectAssignment.findByPk(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Soft delete by setting isActive to false
    await assignment.update({ isActive: false });

    // Create notification for employee
    const project = await Project.findByPk(assignment.projectId);
    await Notification.create({
      userId: assignment.employeeId,
      title: 'Project Assignment Removed',
      message: `You have been removed from project: ${project.name}`,
      type: 'project_assignment',
      relatedId: project.id,
      relatedType: 'project',
      priority: 'medium'
    });

    res.status(200).json({
      success: true,
      message: "Employee removed from project successfully"
    });

  } catch (error) {
    console.error("Remove employee from project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update assignment role
const handleUpdateAssignmentRole = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }

    const assignment = await ProjectAssignment.findByPk(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    await assignment.update({ role });

    const updatedAssignment = await ProjectAssignment.findOne({
      where: { id: assignmentId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Assignment role updated successfully",
      data: updatedAssignment
    });

  } catch (error) {
    console.error("Update assignment role error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get teammates on same project
const handleGetProjectTeammates = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user is assigned to this project
    const userAssignment = await ProjectAssignment.findOne({
      where: { 
        projectId, 
        employeeId: userId, 
        isActive: true 
      }
    });

    if (!userAssignment) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this project"
      });
    }

    // Get all teammates
    const teammates = await ProjectAssignment.findAll({
      where: { 
        projectId,
        isActive: true,
        employeeId: { [require('sequelize').Op.ne]: userId } // Exclude current user
      },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'fullName', 'email', 'position', 'department', 'phone', 'profileImage']
      }]
    });

    res.status(200).json({
      success: true,
      message: "Project teammates retrieved successfully",
      data: teammates
    });

  } catch (error) {
    console.error("Get project teammates error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};




const handleSubmitWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDeliverables } = req.body;
    const userId = req.user.id;

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'createdBy']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Check if user is the assigned employee
    if (assignment.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }


    // Update assignment
    assignment.workStatus = 'submitted';
    assignment.workSubmittedAt = new Date();
    assignment.actualDeliverables = actualDeliverables;
    await assignment.save();

    // Notify ALL managers/admins about work submission (visible to all managers)
    const employee = await User.findByPk(assignment.employeeId);
    await Notification.create({
      userId: assignment.project.createdBy, // Still set creator as primary recipient
      title: 'Work Submitted',
      message: `${employee.fullName} has submitted completed work for project: ${assignment.project.name}.`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
      priority: 'high',
      targetRole: 'all_managers', // Make visible to all managers/admins
      metadata: {
        employeeId: assignment.employeeId,
        employeeName: employee.fullName,
        projectId: assignment.projectId,
        projectName: assignment.project.name,
        assignmentId: assignment.id
      }
    });

    res.status(200).json({
      success: true,
      message: "Work submitted successfully",
      assignment
    });

  } catch (error) {
    console.error("Submit work error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const handleGetMyAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const assignment = await ProjectAssignment.findOne({
      where: { 
        id,
        employeeId,
        isActive: true
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'description', 'status', 'priority', 'startDate', 'deadline', 'budget', 'projectType', ]
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email', 'phone', 'profileImage', 'role']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or you don't have access to it"
      });
    }

    res.json({
      success: true,
      message: "Assignment retrieved successfully",
      assignment
    });

  } catch (error) {
    console.error("Get assignment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



// Admin: Toggle assignment active status (disable/enable)
const handleToggleAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value (true or false)"
      });
    }

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    assignment.isActive = isActive;
    
    await assignment.save();

    // Create notification for employee
    await Notification.create({
      userId: assignment.employeeId,
      type: isActive ? 'assignment_enabled' : 'assignment_disabled',
      title: isActive ? 'Assignment Enabled' : 'Assignment Disabled',
      message: isActive 
        ? `Your assignment for project "${assignment.project.name}" has been re-enabled by admin.`
        : `Your assignment for project "${assignment.project.name}" has been disabled. Reason: ${reason || 'Not specified'}`,
      relatedId: assignment.id,
      isRead: false
    });

    res.json({
      success: true,
      message: `Assignment ${isActive ? 'enabled' : 'disabled'} successfully`,
      assignment: {
        id: assignment.id,
        projectId: assignment.projectId,
        employeeId: assignment.employeeId,
        isActive: assignment.isActive,
      }
    });

  } catch (error) {
    console.error("Toggle assignment status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get ongoing projects for the logged-in employee (accepted and in progress)
const handleGetOngoingProjects = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const ongoingAssignments = await ProjectAssignment.findAll({
      where: {
        employeeId,
        workStatus: ['in_progress'],
        isActive: true
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'description', 'status', 'priority', 'deadline', 'budget']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        }
      ],
      order: [['workStartedAt', 'DESC']]
    });

    // Calculate progress statistics
    const totalAssignments = ongoingAssignments.length;
    const inProgress = ongoingAssignments.filter(a => a.workStatus === 'in_progress').length;
    
    // Calculate total allocated amount
    const totalAllocated = ongoingAssignments.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0);

    res.json({
      success: true,
      message: "Ongoing projects retrieved successfully",
      summary: {
        totalOngoing: totalAssignments,
        inProgress,
        totalAllocatedAmount: totalAllocated
      },
      projects: ongoingAssignments
    });

  } catch (error) {
    console.error("Get ongoing projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get completed/verified projects for the logged-in employee
const handleGetCompletedProjects = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const completedAssignments = await ProjectAssignment.findAll({
      where: {
        employeeId,
        workStatus: 'submitted',
        isActive: true
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'description', 'status', 'priority', 'deadline', 'budget']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email', 'profileImage']
        },

      ],
    });

    // Calculate statistics
    const totalCompleted = completedAssignments.length;
    const totalEarned = completedAssignments.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0);
    
    // Group by year and month
    const completionsByMonth = {};
    completedAssignments.forEach(assignment => {
      if (assignment.workVerifiedAt) {
        const date = new Date(assignment.workVerifiedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!completionsByMonth[monthKey]) {
          completionsByMonth[monthKey] = {
            month: monthKey,
            count: 0,
            earned: 0
          };
        }
        
        completionsByMonth[monthKey].count++;
        completionsByMonth[monthKey].earned += parseFloat(assignment.allocatedAmount) || 0;
      }
    });

    res.json({
      success: true,
      message: "Completed projects retrieved successfully",
      summary: {
        totalCompleted,
        totalEarned,
        averagePerProject: totalCompleted > 0 ? (totalEarned / totalCompleted).toFixed(2) : 0
      },
      completionsByMonth: Object.values(completionsByMonth),
      projects: completedAssignments
    });

  } catch (error) {
    console.error("Get completed projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleGetAllProjectAssignments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, name } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    const { count, rows } = await Project.findAndCountAll({
      where,
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator', 
          attributes: ['id', 'fullName', 'email', 'role']
        },
        {
          model: ProjectAssignment,
          as: 'assignments', 
          required: false, 
          include: [
            {
              model: User,
              as: 'employee', 
              attributes: ['id', 'fullName', 'email', 'position']
            },
            {
              model: User,
              as: 'assigner',
              attributes: ['id', 'fullName', 'email']
            }
          ]
        }
      ],
      distinct: true, 
      col: 'id' 
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: {
        projects: {
          count: count,
          rows: rows
        },
        pagination: {
          totalPages: totalPages,
          currentPage: page,
          limit: limit,
          totalProjects: count
        }
      }
    });

  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


module.exports = {
  handleAssignEmployeeToProject,
  handleGetProjectAssignments,
  handleRemoveEmployeeFromProject,
  handleUpdateAssignmentRole,
  handleGetProjectTeammates,
  handleSubmitWork,
  handleGetMyAssignmentById,
  handleGetOngoingProjects,
  handleGetCompletedProjects,
  handleToggleAssignmentStatus,
  handleGetAllProjectAssignments
};
