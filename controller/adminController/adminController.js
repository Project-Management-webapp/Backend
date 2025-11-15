const User = require("../../model/userModel/user");
const Project = require("../../model/projectModel/project");
const ProjectAssignment = require("../../model/projectAssignmentModel/projectAssignment");
const { Op } = require("sequelize");
const { sendManagerApprovalEmail } = require("../../emailService/approvalEmail");

// Get all managers with their details
const handleGetAllManagers = async (req, res) => {
  try {
    const { 
      status, 
      approvalStatus,
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = { role: 'manager' };

    if (status) {
      whereConditions.status = status;
    }

    if (approvalStatus) {
      whereConditions.approvalStatus = approvalStatus;
    }

    if (search) {
      whereConditions[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } }
      ];
    }

    const managers = await User.findAndCountAll({
      where: whereConditions,
      attributes: { 
        exclude: ['password'] 
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Managers retrieved successfully",
      data: {
        managers: managers.rows,
        pagination: {
          total: managers.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(managers.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get all managers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get manager by ID with their employees
const handleGetManagerById = async (req, res) => {
  try {
    const { managerId } = req.params;

    const manager = await User.findOne({
      where: { 
        id: managerId, 
        role: 'manager' 
      },
      attributes: { exclude: ['password'] }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    // Get employees created by this manager
    const employees = await User.findAll({
      where: { 
        createdBy: managerId,
        role: 'employee'
      },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    // Get projects created by this manager
    const projects = await Project.findAll({
      where: { createdBy: managerId },
      order: [['createdAt', 'DESC']]
    });

    // Get total employee count
    const totalEmployees = employees.length;
    
    // Get active projects count
    const activeProjects = projects.filter(p => p.status === 'ongoing').length;

    res.status(200).json({
      success: true,
      message: "Manager details retrieved successfully",
      data: {
        manager,
        employees,
        projects,
        statistics: {
          totalEmployees,
          totalProjects: projects.length,
          activeProjects,
          completedProjects: projects.filter(p => p.status === 'completed').length
        }
      }
    });
  } catch (error) {
    console.error("Get manager by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get pending managers (for approval)
const handleGetPendingManagers = async (req, res) => {
  try {
    const pendingManagers = await User.findAll({
      where: { 
        role: 'manager',
        approvalStatus: 'pending'
      },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Pending managers retrieved successfully",
      data: {
        managers: pendingManagers,
        count: pendingManagers.length
      }
    });
  } catch (error) {
    console.error("Get pending managers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Approve manager
const handleApproveManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const adminId = req.user.id;

    const manager = await User.findOne({
      where: { 
        id: managerId, 
        role: 'manager' 
      }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    if (manager.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: "Manager is already approved"
      });
    }

    // Update manager status
    manager.approvalStatus = 'approved';
    manager.approvedBy = adminId;
    manager.approvedAt = new Date();
    manager.isActive = true;
    await manager.save();

    // Send approval email
    try {
      await sendManagerApprovalEmail(manager.email, manager.fullName || 'Manager', true);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Continue even if email fails
    }

    res.status(200).json({
      success: true,
      message: "Manager approved successfully",
      data: {
        manager: {
          id: manager.id,
          email: manager.email,
          fullName: manager.fullName,
          approvalStatus: manager.approvalStatus,
          approvedAt: manager.approvedAt
        }
      }
    });
  } catch (error) {
    console.error("Approve manager error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reject manager
const handleRejectManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const manager = await User.findOne({
      where: { 
        id: managerId, 
        role: 'manager' 
      }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    if (manager.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: "Manager is already rejected"
      });
    }

    // Update manager status
    manager.approvalStatus = 'rejected';
    manager.approvedBy = adminId;
    manager.approvedAt = new Date();
    manager.rejectionReason = reason || 'No reason provided';
    manager.isActive = false;
    await manager.save();

    // Send rejection email
    try {
      await sendManagerApprovalEmail(manager.email, manager.fullName || 'Manager', false, reason);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
      // Continue even if email fails
    }

    res.status(200).json({
      success: true,
      message: "Manager rejected successfully",
      data: {
        manager: {
          id: manager.id,
          email: manager.email,
          fullName: manager.fullName,
          approvalStatus: manager.approvalStatus,
          rejectionReason: manager.rejectionReason
        }
      }
    });
  } catch (error) {
    console.error("Reject manager error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all employees across all managers
const handleGetAllEmployees = async (req, res) => {
  try {
    const { 
      managerId,
      status, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = { role: 'employee' };

    if (managerId) {
      whereConditions.createdBy = managerId;
    }

    if (status) {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } }
      ];
    }

    const employees = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email'],
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: {
        employees: employees.rows,
        pagination: {
          total: employees.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(employees.count / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get all employees error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get system statistics
const handleGetSystemStats = async (req, res) => {
  try {
    const totalManagers = await User.count({ where: { role: 'manager' } });
    const approvedManagers = await User.count({ where: { role: 'manager', approvalStatus: 'approved' } });
    const pendingManagers = await User.count({ where: { role: 'manager', approvalStatus: 'pending' } });
    const rejectedManagers = await User.count({ where: { role: 'manager', approvalStatus: 'rejected' } });
    const totalEmployees = await User.count({ where: { role: 'employee' } });
    const totalProjects = await Project.count();
    const activeProjects = await Project.count({ where: { status: 'ongoing' } });

    res.status(200).json({
      success: true,
      message: "System statistics retrieved successfully",
      data: {
        managers: {
          total: totalManagers,
          approved: approvedManagers,
          pending: pendingManagers,
          rejected: rejectedManagers
        },
        employees: {
          total: totalEmployees
        },
        projects: {
          total: totalProjects,
          active: activeProjects
        }
      }
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleGetAllManagers,
  handleGetManagerById,
  handleGetPendingManagers,
  handleApproveManager,
  handleRejectManager,
  handleGetAllEmployees,
  handleGetSystemStats
};
