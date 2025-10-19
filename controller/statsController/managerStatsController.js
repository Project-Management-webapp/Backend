const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const Payment = require('../../model/paymentModel/payment');
const SupportTicket = require('../../model/supportTicketModel/supportTicket');
const Notification = require('../../model/notificationModel/notification');
const Message = require('../../model/messageModel/message');
const { Op } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

// Get comprehensive dashboard statistics for manager
const handleGetDashboardStats = async (req, res) => {
  try {
    const managerId = req.user.id;

    // Get manager details
    const manager = await User.findByPk(managerId, {
      attributes: ['id', 'fullName', 'email', 'position', 'department']
    });

    // Projects Statistics
    const projectStats = await Project.findAll({
      where: { createdBy: managerId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProjects'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'activeProjects'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completedProjects'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END")), 'onHoldProjects'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'planning' THEN 1 ELSE 0 END")), 'planningProjects'],
        [sequelize.fn('SUM', sequelize.col('budget')), 'totalBudget'],
      ],
      raw: true
    });

    // Get projects for further stats
    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    // Employee/Assignment Statistics
    const assignmentStats = await ProjectAssignment.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAssignments'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('employeeId'))), 'uniqueEmployees'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'accepted' THEN 1 ELSE 0 END")), 'acceptedAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'pending' THEN 1 ELSE 0 END")), 'pendingAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'rejected' THEN 1 ELSE 0 END")), 'rejectedAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'verified' THEN 1 ELSE 0 END")), 'verifiedWork'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'in_progress' THEN 1 ELSE 0 END")), 'inProgressWork'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'submitted' THEN 1 ELSE 0 END")), 'submittedWork'],
        [sequelize.fn('SUM', sequelize.col('allocatedAmount')), 'totalAllocatedAmount'],
      ],
      raw: true
    });

    // Payment Statistics
    const paymentStats = await Payment.findAll({
      where: { 
        projectId: { [Op.in]: projectIds }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'requested' THEN 1 ELSE 0 END")), 'pendingPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'paid' THEN 1 ELSE 0 END")), 'paidPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'confirmed' THEN 1 ELSE 0 END")), 'confirmedPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'rejected' THEN 1 ELSE 0 END")), 'rejectedPayments'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalPaymentAmount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'confirmed' THEN amount ELSE 0 END")), 'totalPaidAmount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'requested' THEN amount ELSE 0 END")), 'totalPendingAmount'],
      ],
      raw: true
    });

    // Support Ticket Statistics (all tickets system-wide for manager view)
    const ticketStats = await SupportTicket.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTickets'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'open' THEN 1 ELSE 0 END")), 'openTickets'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END")), 'inProgressTickets'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'resolved' THEN 1 ELSE 0 END")), 'resolvedTickets'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'closed' THEN 1 ELSE 0 END")), 'closedTickets'],
      ],
      raw: true
    });

    // Notification Statistics
    const notificationStats = await Notification.findAll({
      where: { userId: managerId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalNotifications'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN isRead = 0 THEN 1 ELSE 0 END")), 'unreadNotifications'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN priority = 'high' AND isRead = 0 THEN 1 ELSE 0 END")), 'highPriorityUnread'],
      ],
      raw: true
    });

    // Team size
    const teamSize = await User.count({
      where: { 
        role: { [Op.in]: ['employee', 'intern'] },
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      message: "Manager dashboard statistics retrieved successfully",
      data: {
        manager: {
          id: manager.id,
          fullName: manager.fullName,
          email: manager.email,
          position: manager.position,
          department: manager.department,
        },
        projects: {
          total: parseInt(projectStats[0].totalProjects || 0),
          active: parseInt(projectStats[0].activeProjects || 0),
          completed: parseInt(projectStats[0].completedProjects || 0),
          onHold: parseInt(projectStats[0].onHoldProjects || 0),
          planning: parseInt(projectStats[0].planningProjects || 0),
          totalBudget: parseFloat(projectStats[0].totalBudget || 0),
        },
        team: {
          totalEmployees: teamSize,
          uniqueAssigned: parseInt(assignmentStats[0].uniqueEmployees || 0),
          totalAssignments: parseInt(assignmentStats[0].totalAssignments || 0),
          activeWorkers: parseInt(assignmentStats[0].inProgressWork || 0),
        },
        assignments: {
          total: parseInt(assignmentStats[0].totalAssignments || 0),
          accepted: parseInt(assignmentStats[0].acceptedAssignments || 0),
          pending: parseInt(assignmentStats[0].pendingAssignments || 0),
          rejected: parseInt(assignmentStats[0].rejectedAssignments || 0),
        },
        workStatus: {
          verified: parseInt(assignmentStats[0].verifiedWork || 0),
          inProgress: parseInt(assignmentStats[0].inProgressWork || 0),
          submitted: parseInt(assignmentStats[0].submittedWork || 0),
          totalAllocated: parseFloat(assignmentStats[0].totalAllocatedAmount || 0),
        },
        payments: {
          total: parseInt(paymentStats[0].totalPayments || 0),
          pending: parseInt(paymentStats[0].pendingPayments || 0),
          paid: parseInt(paymentStats[0].paidPayments || 0),
          confirmed: parseInt(paymentStats[0].confirmedPayments || 0),
          rejected: parseInt(paymentStats[0].rejectedPayments || 0),
          totalAmount: parseFloat(paymentStats[0].totalPaymentAmount || 0),
          paidAmount: parseFloat(paymentStats[0].totalPaidAmount || 0),
          pendingAmount: parseFloat(paymentStats[0].totalPendingAmount || 0),
        },
        tickets: {
          total: parseInt(ticketStats[0].totalTickets || 0),
          open: parseInt(ticketStats[0].openTickets || 0),
          inProgress: parseInt(ticketStats[0].inProgressTickets || 0),
          resolved: parseInt(ticketStats[0].resolvedTickets || 0),
          closed: parseInt(ticketStats[0].closedTickets || 0),
        },
        notifications: {
          total: parseInt(notificationStats[0].totalNotifications || 0),
          unread: parseInt(notificationStats[0].unreadNotifications || 0),
          highPriorityUnread: parseInt(notificationStats[0].highPriorityUnread || 0),
        }
      }
    });

  } catch (error) {
    console.error("Get manager dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get project status distribution (for pie chart)
const handleGetProjectDistribution = async (req, res) => {
  try {
    const managerId = req.user.id;

    const distribution = await Project.findAll({
      where: { createdBy: managerId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('budget')), 'totalBudget'],
      ],
      group: ['status'],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Project distribution retrieved successfully",
      data: distribution.map(d => ({
        status: d.status,
        count: parseInt(d.count || 0),
        totalBudget: parseFloat(d.totalBudget || 0)
      }))
    });

  } catch (error) {
    console.error("Get project distribution error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get payment trends over time (for line/bar chart)
const handleGetPaymentTrends = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    let groupBy;
    let dateFormat;

    if (period === 'monthly') {
      groupBy = sequelize.fn('MONTH', sequelize.col('requestedAt'));
      dateFormat = sequelize.fn('DATE_FORMAT', sequelize.col('requestedAt'), '%Y-%m');
    } else if (period === 'weekly') {
      groupBy = sequelize.fn('WEEK', sequelize.col('requestedAt'));
      dateFormat = sequelize.fn('DATE_FORMAT', sequelize.col('requestedAt'), '%Y-%u');
    } else {
      groupBy = sequelize.fn('DATE', sequelize.col('requestedAt'));
      dateFormat = sequelize.fn('DATE', sequelize.col('requestedAt'));
    }

    const payments = await Payment.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        requestedAt: {
          [Op.not]: null,
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lte]: new Date(`${year}-12-31`)
        }
      },
      attributes: [
        [dateFormat, 'period'],
        'requestStatus',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'paymentCount'],
      ],
      group: [groupBy, 'requestStatus'],
      order: [[groupBy, 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Payment trends retrieved successfully",
      data: {
        period,
        year: parseInt(year),
        payments: payments.map(p => ({
          period: p.period,
          status: p.requestStatus,
          amount: parseFloat(p.totalAmount || 0),
          count: parseInt(p.paymentCount || 0)
        }))
      }
    });

  } catch (error) {
    console.error("Get payment trends error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get team performance metrics
const handleGetTeamPerformance = async (req, res) => {
  try {
    const managerId = req.user.id;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    // Get top performers
    const topPerformers = await ProjectAssignment.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        workStatus: 'verified'
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position', 'profileImage']
        }
      ],
      attributes: [
        'employeeId',
        [sequelize.fn('COUNT', sequelize.col('ProjectAssignment.id')), 'completedTasks'],
        [sequelize.fn('SUM', sequelize.col('allocatedAmount')), 'totalEarned'],
      ],
      group: ['employeeId', 'employee.id', 'employee.fullName', 'employee.email', 'employee.position', 'employee.profileImage'],
      order: [[sequelize.fn('COUNT', sequelize.col('ProjectAssignment.id')), 'DESC']],
      limit: 10,
      raw: true,
      nest: true
    });

    // Get work completion stats
    const completionStats = await ProjectAssignment.findAll({
      where: {
        projectId: { [Op.in]: projectIds }
      },
      attributes: [
        'workStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.literal('DATEDIFF(workVerifiedAt, acceptedAt)')), 'avgCompletionDays'],
      ],
      group: ['workStatus'],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Team performance retrieved successfully",
      data: {
        topPerformers: topPerformers.map(p => ({
          employeeId: p.employeeId,
          employee: p.employee,
          completedTasks: parseInt(p.completedTasks || 0),
          totalEarned: parseFloat(p.totalEarned || 0)
        })),
        completionStats: completionStats.map(s => ({
          workStatus: s.workStatus,
          count: parseInt(s.count || 0),
          avgCompletionDays: Math.round(parseFloat(s.avgCompletionDays || 0))
        }))
      }
    });

  } catch (error) {
    console.error("Get team performance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get project progress overview
const handleGetProjectProgress = async (req, res) => {
  try {
    const managerId = req.user.id;

    const projects = await Project.findAll({
      where: { createdBy: managerId },
      include: [
        {
          model: ProjectAssignment,
          as: 'assignments',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        'status',
        'priority',
        'budget',
        'startDate',
        'endDate',
        [sequelize.fn('COUNT', sequelize.col('assignments.id')), 'totalAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignments.workStatus = 'verified' THEN 1 ELSE 0 END")), 'completedAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignments.workStatus = 'in_progress' THEN 1 ELSE 0 END")), 'inProgressAssignments'],
      ],
      group: ['Project.id', 'Project.name', 'Project.status', 'Project.priority', 'Project.budget', 'Project.startDate', 'Project.endDate'],
      order: [['createdAt', 'DESC']],
      limit: 10,
      raw: true
    });

    const projectProgress = projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      priority: p.priority,
      budget: parseFloat(p.budget || 0),
      startDate: p.startDate,
      endDate: p.endDate,
      totalAssignments: parseInt(p.totalAssignments || 0),
      completedAssignments: parseInt(p.completedAssignments || 0),
      inProgressAssignments: parseInt(p.inProgressAssignments || 0),
      completionPercentage: p.totalAssignments > 0 
        ? Math.round((parseInt(p.completedAssignments || 0) / parseInt(p.totalAssignments || 0)) * 100)
        : 0
    }));

    res.status(200).json({
      success: true,
      message: "Project progress retrieved successfully",
      data: projectProgress
    });

  } catch (error) {
    console.error("Get project progress error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get budget utilization (for gauge/progress charts)
const handleGetBudgetUtilization = async (req, res) => {
  try {
    const managerId = req.user.id;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id', 'name', 'budget']
    });

    const budgetData = [];

    for (const project of managerProjects) {
      const totalAllocated = await ProjectAssignment.sum('allocatedAmount', {
        where: { projectId: project.id }
      }) || 0;

      const totalPaid = await Payment.sum('amount', {
        where: {
          projectId: project.id,
          requestStatus: 'confirmed'
        }
      }) || 0;

      budgetData.push({
        projectId: project.id,
        projectName: project.name,
        totalBudget: parseFloat(project.budget || 0),
        allocated: parseFloat(totalAllocated),
        paid: parseFloat(totalPaid),
        remaining: parseFloat(project.budget || 0) - parseFloat(totalAllocated),
        utilizationPercentage: project.budget > 0 
          ? Math.round((parseFloat(totalAllocated) / parseFloat(project.budget)) * 100)
          : 0
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget utilization retrieved successfully",
      data: budgetData
    });

  } catch (error) {
    console.error("Get budget utilization error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get assignment acceptance rate trends
const handleGetAssignmentTrends = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { months = 6 } = req.query;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const trends = await ProjectAssignment.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        assignedAt: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('assignedAt'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAssigned'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'accepted' THEN 1 ELSE 0 END")), 'accepted'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'rejected' THEN 1 ELSE 0 END")), 'rejected'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'pending' THEN 1 ELSE 0 END")), 'pending'],
      ],
      group: ['month'],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('assignedAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    const acceptanceRate = trends.map(t => ({
      month: t.month,
      totalAssigned: parseInt(t.totalAssigned || 0),
      accepted: parseInt(t.accepted || 0),
      rejected: parseInt(t.rejected || 0),
      pending: parseInt(t.pending || 0),
      acceptanceRate: t.totalAssigned > 0 
        ? Math.round((parseInt(t.accepted || 0) / parseInt(t.totalAssigned || 0)) * 100)
        : 0
    }));

    res.status(200).json({
      success: true,
      message: "Assignment trends retrieved successfully",
      data: acceptanceRate
    });

  } catch (error) {
    console.error("Get assignment trends error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get ticket resolution statistics
const handleGetTicketResolutionStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const tickets = await SupportTicket.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.literal('DATEDIFF(resolvedAt, createdAt)')), 'avgResolutionDays'],
      ],
      group: ['month', 'status'],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Ticket resolution statistics retrieved successfully",
      data: tickets.map(t => ({
        month: t.month,
        status: t.status,
        count: parseInt(t.count || 0),
        avgResolutionDays: Math.round(parseFloat(t.avgResolutionDays || 0))
      }))
    });

  } catch (error) {
    console.error("Get ticket resolution stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get employee workload distribution
const handleGetWorkloadDistribution = async (req, res) => {
  try {
    const managerId = req.user.id;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    const workload = await ProjectAssignment.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        assignmentStatus: 'accepted'
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position']
        }
      ],
      attributes: [
        'employeeId',
        [sequelize.fn('COUNT', sequelize.col('ProjectAssignment.id')), 'totalTasks'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'in_progress' THEN 1 ELSE 0 END")), 'activeTasks'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'verified' THEN 1 ELSE 0 END")), 'completedTasks'],
        [sequelize.fn('SUM', sequelize.col('allocatedAmount')), 'totalAllocation'],
      ],
      group: ['employeeId', 'employee.id', 'employee.fullName', 'employee.email', 'employee.position'],
      order: [[sequelize.fn('COUNT', sequelize.col('ProjectAssignment.id')), 'DESC']],
      raw: true,
      nest: true
    });

    res.status(200).json({
      success: true,
      message: "Workload distribution retrieved successfully",
      data: workload.map(w => ({
        employeeId: w.employeeId,
        employee: w.employee,
        totalTasks: parseInt(w.totalTasks || 0),
        activeTasks: parseInt(w.activeTasks || 0),
        completedTasks: parseInt(w.completedTasks || 0),
        totalAllocation: parseFloat(w.totalAllocation || 0)
      }))
    });

  } catch (error) {
    console.error("Get workload distribution error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get recent activities (for timeline)
const handleGetActivitySummary = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { limit = 10 } = req.query;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    // Recent notifications
    const recentNotifications = await Notification.findAll({
      where: { userId: managerId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'title', 'message', 'type', 'priority', 'isRead', 'createdAt']
    });

    // Recent assignments
    const recentAssignments = await ProjectAssignment.findAll({
      where: { projectId: { [Op.in]: projectIds } },
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
      ],
      order: [['assignedAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'assignmentStatus', 'workStatus', 'assignedAt']
    });

    // Recent payment requests
    const recentPayments = await Payment.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'amount', 'requestStatus', 'currency', 'createdAt']
    });

    // Recent tickets
    const recentTickets = await SupportTicket.findAll({
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'ticketId', 'subject', 'status', 'priority', 'createdAt']
    });

    res.status(200).json({
      success: true,
      message: "Activity summary retrieved successfully",
      data: {
        recentNotifications,
        recentAssignments,
        recentPayments,
        recentTickets
      }
    });

  } catch (error) {
    console.error("Get activity summary error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get payment approval queue
const handleGetPaymentQueue = async (req, res) => {
  try {
    const managerId = req.user.id;

    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    const pendingPayments = await Payment.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        requestStatus: 'requested'
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      order: [['requestedAt', 'ASC']],
      attributes: ['id', 'amount', 'currency', 'requestStatus', 'requestedAt', 'requestNotes']
    });

    res.status(200).json({
      success: true,
      message: "Payment queue retrieved successfully",
      data: {
        pendingPayments,
        totalPending: pendingPayments.length,
        totalAmount: pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      }
    });

  } catch (error) {
    console.error("Get payment queue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleGetDashboardStats,
  handleGetProjectDistribution,
  handleGetPaymentTrends,
  handleGetTeamPerformance,
  handleGetProjectProgress,
  handleGetBudgetUtilization,
  handleGetAssignmentTrends,
  handleGetTicketResolutionStats,
  handleGetWorkloadDistribution,
  handleGetActivitySummary,
  handleGetPaymentQueue,
};
