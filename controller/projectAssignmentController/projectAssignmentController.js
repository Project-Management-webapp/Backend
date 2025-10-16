const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const Project = require('../../model/projectModel/project');
const User = require('../../model/userModel/user');
const Notification = require('../../model/notificationModel/notification');

const handleAssignEmployeeToProject = async (req, res) => {
  try {
    const { projectId, employeeId, role, allocatedAmount, paymentSchedule, paymentTerms, responsibilities, deliverables, responseDeadline } = req.body;
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

    // Calculate response deadline (default 48 hours)
    const deadline = responseDeadline || new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Create assignment with pending status
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
      responseDeadline: deadline,
      workStatus: 'not_started',
    });

    // Update project allocated amount
    project.allocatedAmount = parseFloat(project.allocatedAmount || 0) + parseFloat(allocatedAmount);
    await project.save();

    // Create notification for employee
    await Notification.create({
      userId: employeeId,
      title: 'New Project Assignment',
      message: `You have been assigned to project: ${project.name}. Allocated Amount: ${allocatedAmount} ${project.currency}. Please accept or reject within 48 hours.`,
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

// Accept project assignment (Employee only)
const handleAcceptAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'budget', 'createdBy']
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

    // Check if assignment is still pending
    if (assignment.assignmentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Assignment already ${assignment.assignmentStatus}`
      });
    }

    // Update assignment status
    assignment.assignmentStatus = 'accepted';
    assignment.acceptedAt = new Date();
    assignment.workStatus = 'in_progress';
    assignment.workStartedAt = new Date();
    await assignment.save();

    // Notify manager/creator
    await Notification.create({
      userId: assignment.project.createdBy,
      title: 'Assignment Accepted',
      message: `Employee has accepted the assignment for project: ${assignment.project.name}`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
    });

    // Notify assignedBy user
    if (assignment.assignedBy !== assignment.project.createdBy) {
      await Notification.create({
        userId: assignment.assignedBy,
        title: 'Assignment Accepted',
        message: `Employee has accepted the assignment for project: ${assignment.project.name}`,
        type: 'project_assignment',
        relatedId: assignment.projectId,
        relatedType: 'project',
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment accepted successfully. You can now start working on the project.",
      assignment
    });

  } catch (error) {
    console.error("Accept assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reject project assignment (Employee only)
const handleRejectAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;
    const userId = req.user.id;

    if (!rejectedReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name',  'budget', 'allocatedAmount', 'createdBy']
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

    // Check if assignment is still pending
    if (assignment.assignmentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Assignment already ${assignment.assignmentStatus}`
      });
    }

    // Update assignment status
    assignment.assignmentStatus = 'rejected';
    assignment.rejectedAt = new Date();
    assignment.rejectedReason = rejectedReason;
    assignment.isActive = false;
    await assignment.save();

    // Return allocated amount to project budget
    const project = assignment.project;
    project.allocatedAmount = parseFloat(project.allocatedAmount || 0) - parseFloat(assignment.allocatedAmount);
    await project.save();

    // Notify manager/creator
    await Notification.create({
      userId: project.createdBy,
      title: 'Assignment Rejected',
      message: `Employee rejected the assignment for project: ${project.name}. Reason: ${rejectedReason}`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
      priority: 'high'
    });

    // Notify assignedBy user
    if (assignment.assignedBy !== project.createdBy) {
      await Notification.create({
        userId: assignment.assignedBy,
        title: 'Assignment Rejected',
        message: `Employee rejected the assignment for project: ${project.name}. Reason: ${rejectedReason}`,
        type: 'project_assignment',
        relatedId: assignment.projectId,
        relatedType: 'project',
        priority: 'high'
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment rejected successfully",
      assignment
    });

  } catch (error) {
    console.error("Reject assignment error:", error);
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
    const { workSubmissionNotes, actualDeliverables } = req.body;
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

    // Check if assignment is accepted
    if (assignment.assignmentStatus !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: "You must accept the assignment before submitting work"
      });
    }

    // Update assignment
    assignment.workStatus = 'submitted';
    assignment.workSubmittedAt = new Date();
    assignment.workSubmissionNotes = workSubmissionNotes;
    assignment.actualDeliverables = actualDeliverables;
    await assignment.save();

    // Notify manager/creator
    await Notification.create({
      userId: assignment.project.createdBy,
      title: 'Work Submitted',
      message: `Employee has submitted completed work for project: ${assignment.project.name}. Please verify.`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Work submitted successfully. Waiting for manager verification.",
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

// Verify employee's work (Manager/Admin only)
const handleVerifyWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes,  performanceFeedback } = req.body;
    const userId = req.user.id;

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name',]
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'completedProjectsCount']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Check if work is submitted
    if (assignment.workStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: "Work has not been submitted yet"
      });
    }

    // Update assignment
    assignment.workStatus = 'verified';
    assignment.workVerifiedAt = new Date();
    assignment.workVerifiedBy = userId;
    assignment.verificationNotes = verificationNotes;
    assignment.performanceFeedback = performanceFeedback;
    await assignment.save();

    // Update employee's completed projects count
    const employee = assignment.employee;
    employee.completedProjectsCount = (employee.completedProjectsCount || 0) + 1;
    await employee.save();

    // Notify employee
    await Notification.create({
      userId: assignment.employeeId,
      title: 'Work Verified',
      message: `Your work for project: ${assignment.project.name} has been verified. You can now request payment.`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Work verified successfully",
      assignment
    });

  } catch (error) {
    console.error("Verify work error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reject employee's work (Manager/Admin only)
const handleRejectWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, revisionDeadline } = req.body;
    const userId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
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

    // Check if work is submitted
    if (assignment.workStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: "Work has not been submitted yet"
      });
    }

    // Update assignment
    assignment.workStatus = 'rejected';
    assignment.workRejectedAt = new Date();
    assignment.rejectionReason = rejectionReason;
    assignment.revisionDeadline = revisionDeadline;
    await assignment.save();

    // Notify employee
    await Notification.create({
      userId: assignment.employeeId,
      title: 'Work Rejected',
      message: `Your work for project: ${assignment.project.name} needs revision. Reason: ${rejectionReason}`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Work rejected. Employee has been notified for revision.",
      assignment
    });

  } catch (error) {
    console.error("Reject work error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleRequestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { revisionNotes, revisionDeadline } = req.body;
    const userId = req.user.id;

    if (!revisionNotes) {
      return res.status(400).json({
        success: false,
        message: "Revision notes are required"
      });
    }

    const assignment = await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name',]
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Update assignment
    assignment.workStatus = 'revision_required';
    assignment.verificationNotes = revisionNotes;
    assignment.revisionDeadline = revisionDeadline;
    await assignment.save();

    // Notify employee
    await Notification.create({
      userId: assignment.employeeId,
      title: 'Revision Required',
      message: `Revision required for project: ${assignment.project.name}. ${revisionNotes}`,
      type: 'project_assignment',
      relatedId: assignment.projectId,
      relatedType: 'project',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Revision requested successfully",
      assignment
    });

  } catch (error) {
    console.error("Request revision error:", error);
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
  handleAcceptAssignment,
  handleRejectAssignment,
  handleSubmitWork,
  handleVerifyWork,
  handleRejectWork,
  handleRequestRevision,
};
