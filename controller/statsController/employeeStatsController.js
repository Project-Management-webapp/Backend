const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const Payment = require('../../model/paymentModel/payment');
const SupportTicket = require('../../model/supportTicketModel/supportTicket');
const Notification = require('../../model/notificationModel/notification');
const Message = require('../../model/messageModel/message');
const { Op } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');

// Get comprehensive dashboard statistics
const handleGetDashboardStats = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // Get employee details with earnings
    const employee = await User.findByPk(employeeId, {
      attributes: ['id', 'fullName', 'email', 'totalEarnings', 'pendingEarnings', 'projectEarnings', 'position', 'department']
    });

    // Project Assignment Statistics
    const assignmentStats = await ProjectAssignment.findAll({
      where: { employeeId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'accepted' THEN 1 ELSE 0 END")), 'acceptedAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'pending' THEN 1 ELSE 0 END")), 'pendingAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN assignmentStatus = 'rejected' THEN 1 ELSE 0 END")), 'rejectedAssignments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'completed' THEN 1 ELSE 0 END")), 'completedWork'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'in_progress' THEN 1 ELSE 0 END")), 'inProgressWork'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'verified' THEN 1 ELSE 0 END")), 'verifiedWork'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'submitted' THEN 1 ELSE 0 END")), 'submittedWork'],
      ],
      raw: true
    });

    // Payment Statistics
    const paymentStats = await Payment.findAll({
      where: { employeeId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'requested' THEN 1 ELSE 0 END")), 'requestedPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'paid' THEN 1 ELSE 0 END")), 'paidPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'confirmed' THEN 1 ELSE 0 END")), 'confirmedPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'rejected' THEN 1 ELSE 0 END")), 'rejectedPayments'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'confirmed' THEN amount ELSE 0 END")), 'totalConfirmedAmount'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN requestStatus = 'requested' THEN amount ELSE 0 END")), 'totalPendingAmount'],
      ],
      raw: true
    });

    // Support Ticket Statistics
    const ticketStats = await SupportTicket.findAll({
      where: { employeeId },
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
      where: { userId: employeeId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalNotifications'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN isRead = 0 THEN 1 ELSE 0 END")), 'unreadNotifications'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN priority = 'high' AND isRead = 0 THEN 1 ELSE 0 END")), 'highPriorityUnread'],
      ],
      raw: true
    });

    // Active Projects Count
    const activeProjectsCount = await ProjectAssignment.count({
      where: {
        employeeId,
        assignmentStatus: 'accepted',
        workStatus: { [Op.in]: ['not_started', 'in_progress', 'submitted'] }
      }
    });

    // Completed Projects Count
    const completedProjectsCount = await ProjectAssignment.count({
      where: {
        employeeId,
        workStatus: 'verified'
      }
    });

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        employee: {
          id: employee.id,
          fullName: employee.fullName,
          email: employee.email,
          position: employee.position,
          department: employee.department,
        },
        earnings: {
          totalEarnings: parseFloat(employee.totalEarnings || 0),
          pendingEarnings: parseFloat(employee.pendingEarnings || 0),
          confirmedEarnings: parseFloat(paymentStats[0].totalConfirmedAmount || 0),
          projectEarnings: employee.projectEarnings || []
        },
        projects: {
          active: activeProjectsCount,
          completed: completedProjectsCount,
          total: activeProjectsCount + completedProjectsCount
        },
        assignments: {
          total: parseInt(assignmentStats[0].totalAssignments || 0),
          accepted: parseInt(assignmentStats[0].acceptedAssignments || 0),
          pending: parseInt(assignmentStats[0].pendingAssignments || 0),
          rejected: parseInt(assignmentStats[0].rejectedAssignments || 0),
        },
        workStatus: {
          completed: parseInt(assignmentStats[0].completedWork || 0),
          inProgress: parseInt(assignmentStats[0].inProgressWork || 0),
          verified: parseInt(assignmentStats[0].verifiedWork || 0),
          submitted: parseInt(assignmentStats[0].submittedWork || 0),
        },
        payments: {
          total: parseInt(paymentStats[0].totalPayments || 0),
          requested: parseInt(paymentStats[0].requestedPayments || 0),
          paid: parseInt(paymentStats[0].paidPayments || 0),
          confirmed: parseInt(paymentStats[0].confirmedPayments || 0),
          rejected: parseInt(paymentStats[0].rejectedPayments || 0),
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
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get earnings over time (for line/bar chart)
const handleGetEarningsOverTime = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy;
    let dateFormat;

    if (period === 'monthly') {
      groupBy = sequelize.fn('MONTH', sequelize.col('confirmedAt'));
      dateFormat = sequelize.fn('DATE_FORMAT', sequelize.col('confirmedAt'), '%Y-%m');
    } else if (period === 'weekly') {
      groupBy = sequelize.fn('WEEK', sequelize.col('confirmedAt'));
      dateFormat = sequelize.fn('DATE_FORMAT', sequelize.col('confirmedAt'), '%Y-%u');
    } else {
      groupBy = sequelize.fn('DATE', sequelize.col('confirmedAt'));
      dateFormat = sequelize.fn('DATE', sequelize.col('confirmedAt'));
    }

    const earnings = await Payment.findAll({
      where: {
        employeeId,
        requestStatus: 'confirmed',
        confirmedAt: {
          [Op.not]: null,
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lte]: new Date(`${year}-12-31`)
        }
      },
      attributes: [
        [dateFormat, 'period'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'paymentCount'],
      ],
      group: [groupBy],
      order: [[groupBy, 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Earnings over time retrieved successfully",
      data: {
        period,
        year: parseInt(year),
        earnings: earnings.map(e => ({
          period: e.period,
          amount: parseFloat(e.totalAmount || 0),
          count: parseInt(e.paymentCount || 0)
        }))
      }
    });

  } catch (error) {
    console.error("Get earnings over time error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get project assignment status distribution (for pie chart)
const handleGetAssignmentDistribution = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const distribution = await ProjectAssignment.findAll({
      where: { employeeId },
      attributes: [
        'workStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('allocatedAmount')), 'totalAmount'],
      ],
      group: ['workStatus'],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Assignment distribution retrieved successfully",
      data: distribution.map(d => ({
        status: d.workStatus,
        count: parseInt(d.count || 0),
        totalAmount: parseFloat(d.totalAmount || 0)
      }))
    });

  } catch (error) {
    console.error("Get assignment distribution error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get project performance metrics
const handleGetProjectPerformance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const performance = await ProjectAssignment.findAll({
      where: {
        employeeId,
        assignmentStatus: 'accepted'
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'priority']
        }
      ],
      attributes: [
        'id',
        'projectId',
        'assignmentStatus',
        'workStatus',
        'allocatedAmount',
        'assignedAt',
        'acceptedAt',
        'workSubmittedAt',
        'workVerifiedAt',
      ],
      order: [['assignedAt', 'DESC']],
      limit: 10
    });

    // Calculate performance metrics
    const metrics = {
      averageCompletionTime: 0,
      onTimeDelivery: 0,
      qualityScore: 0,
    };

    let completedWithTime = 0;
    let totalCompletionDays = 0;
    let verifiedCount = 0;

    performance.forEach(assignment => {
      if (assignment.workVerifiedAt && assignment.acceptedAt) {
        const days = Math.ceil((new Date(assignment.workVerifiedAt) - new Date(assignment.acceptedAt)) / (1000 * 60 * 60 * 24));
        totalCompletionDays += days;
        completedWithTime++;
      }
      if (assignment.workStatus === 'verified') {
        verifiedCount++;
      }
    });

    if (completedWithTime > 0) {
      metrics.averageCompletionTime = Math.round(totalCompletionDays / completedWithTime);
    }

    if (performance.length > 0) {
      metrics.onTimeDelivery = Math.round((verifiedCount / performance.length) * 100);
      metrics.qualityScore = Math.round((verifiedCount / performance.length) * 100);
    }

    res.status(200).json({
      success: true,
      message: "Project performance retrieved successfully",
      data: {
        recentProjects: performance,
        metrics: {
          averageCompletionTime: metrics.averageCompletionTime + ' days',
          onTimeDeliveryRate: metrics.onTimeDelivery + '%',
          qualityScore: metrics.qualityScore + '%',
          totalCompleted: verifiedCount,
          totalAssigned: performance.length
        }
      }
    });

  } catch (error) {
    console.error("Get project performance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get payment request status distribution (for pie chart)
const handleGetPaymentDistribution = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const distribution = await Payment.findAll({
      where: { employeeId },
      attributes: [
        'requestStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      group: ['requestStatus'],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Payment distribution retrieved successfully",
      data: distribution.map(d => ({
        status: d.requestStatus,
        count: parseInt(d.count || 0),
        totalAmount: parseFloat(d.totalAmount || 0)
      }))
    });

  } catch (error) {
    console.error("Get payment distribution error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get ticket trends (for line chart)
const handleGetTicketTrends = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const tickets = await SupportTicket.findAll({
      where: {
        employeeId,
        createdAt: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['month', 'status'],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Ticket trends retrieved successfully",
      data: tickets.map(t => ({
        month: t.month,
        status: t.status,
        count: parseInt(t.count || 0)
      }))
    });

  } catch (error) {
    console.error("Get ticket trends error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get activity summary (recent activities)
const handleGetActivitySummary = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { limit = 10 } = req.query;

    // Get recent notifications
    const recentNotifications = await Notification.findAll({
      where: { userId: employeeId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'title', 'message', 'type', 'priority', 'isRead', 'createdAt']
    });

    // Get recent assignments
    const recentAssignments = await ProjectAssignment.findAll({
      where: { employeeId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        }
      ],
      order: [['assignedAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'assignmentStatus', 'workStatus', 'assignedAt']
    });

    // Get recent payments
    const recentPayments = await Payment.findAll({
      where: { employeeId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'amount', 'requestStatus', 'currency', 'createdAt']
    });

    res.status(200).json({
      success: true,
      message: "Activity summary retrieved successfully",
      data: {
        recentNotifications,
        recentAssignments,
        recentPayments
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

// Get earnings by project (for bar chart)
const handleGetEarningsByProject = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const earnings = await Payment.findAll({
      where: {
        employeeId,
        requestStatus: 'confirmed'
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      attributes: [
        'projectId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'paymentCount'],
      ],
      group: ['projectId', 'project.id', 'project.name'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      raw: true,
      nest: true
    });

    res.status(200).json({
      success: true,
      message: "Earnings by project retrieved successfully",
      data: earnings.map(e => ({
        projectId: e.projectId,
        projectName: e.project?.name || 'Unknown Project',
        totalAmount: parseFloat(e.totalAmount || 0),
        paymentCount: parseInt(e.paymentCount || 0)
      }))
    });

  } catch (error) {
    console.error("Get earnings by project error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get work completion rate over time (for area chart)
const handleGetCompletionRate = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const assignments = await ProjectAssignment.findAll({
      where: {
        employeeId,
        assignedAt: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('assignedAt'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAssigned'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'verified' THEN 1 ELSE 0 END")), 'completed'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN workStatus = 'in_progress' THEN 1 ELSE 0 END")), 'inProgress'],
      ],
      group: ['month'],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('assignedAt'), '%Y-%m'), 'ASC']],
      raw: true
    });

    const completionRate = assignments.map(a => ({
      month: a.month,
      totalAssigned: parseInt(a.totalAssigned || 0),
      completed: parseInt(a.completed || 0),
      inProgress: parseInt(a.inProgress || 0),
      completionRate: a.totalAssigned > 0 ? Math.round((parseInt(a.completed || 0) / parseInt(a.totalAssigned || 0)) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      message: "Completion rate retrieved successfully",
      data: completionRate
    });

  } catch (error) {
    console.error("Get completion rate error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get priority-wise ticket distribution (for donut chart)
const handleGetTicketsByPriority = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const tickets = await SupportTicket.findAll({
      where: { employeeId },
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['priority'],
      raw: true
    });

    res.status(200).json({
      success: true,
      message: "Tickets by priority retrieved successfully",
      data: tickets.map(t => ({
        priority: t.priority,
        count: parseInt(t.count || 0)
      }))
    });

  } catch (error) {
    console.error("Get tickets by priority error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleGetDashboardStats,
  handleGetEarningsOverTime,
  handleGetAssignmentDistribution,
  handleGetProjectPerformance,
  handleGetPaymentDistribution,
  handleGetTicketTrends,
  handleGetActivitySummary,
  handleGetEarningsByProject,
  handleGetCompletionRate,
  handleGetTicketsByPriority,
};
