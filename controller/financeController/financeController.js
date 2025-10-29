const Project = require('../../model/projectModel/project');
const Payment = require('../../model/paymentModel/payment');
const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const User = require('../../model/userModel/user');
const { Op } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');


const handleGetFinancialOverview = async (req, res) => {
  try {
    // Get all projects regardless of status (including empty status)
    const projects = await Project.findAll({
      where: {
        [Op.or]: [
          {
            status: {
              [Op.in]: ['pending', 'in-progress', 'completed']
            }
          },
          {
            status: ''
          },
          {
            status: null
          }
        ]
      }
    });

    // Get all payments for these projects
    const projectIds = projects.map(p => p.id);
    const payments = await Payment.findAll({
      where: {
        projectId: {
          [Op.in]: projectIds
        }
      }
    });

    // Calculate totals
    let totalBudget = 0;
    let totalAllocatedToEmployees = 0;
    let totalPaidToEmployees = 0;
    let totalPendingPayments = 0;
    let totalEstimatedCost = 0;
    let totalActualCost = 0;

    const projectFinancials = [];

    for (const project of projects) {
      const projectBudget = parseFloat(project.budget || 0);
      const allocatedAmount = parseFloat(project.allocatedAmount || 0);
      const spentAmount = parseFloat(project.spentAmount || 0);

      // Calculate estimated costs (hours + consumables)
      const estimatedHoursCost = parseFloat(project.estimatedHours || 0) * 50; // Assume $50/hour
      const estimatedConsumablesCost = Array.isArray(project.estimatedConsumables) 
        ? project.estimatedConsumables.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;

      // Calculate actual costs (hours + consumables)
      const actualHoursCost = parseFloat(project.actualHours || 0) * 50; // Assume $50/hour
      const actualConsumablesCost = Array.isArray(project.actualConsumables)
        ? project.actualConsumables.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;

      // Get payments for this project
      const projectPayments = payments.filter(p => p.projectId === project.id);
      const paidAmount = projectPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      const pendingAmount = projectPayments
        .filter(p => p.requestStatus === 'requested')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const estimatedTotal = estimatedHoursCost + estimatedConsumablesCost + allocatedAmount;
      const actualTotal = actualHoursCost + actualConsumablesCost + paidAmount;
      
      // Profit/Loss = Budget - Actual Costs
      const profitLoss = projectBudget - actualTotal;
      const profitLossPercentage = projectBudget > 0 ? ((profitLoss / projectBudget) * 100).toFixed(2) : 0;

      projectFinancials.push({
        projectId: project.id,
        projectName: project.name,
        projectType: project.projectType,
        customProjectType: project.customProjectType,
        status: project.status,
        budget: projectBudget,
        allocatedToEmployees: allocatedAmount,
        estimatedCost: {
          hours: estimatedHoursCost,
          consumables: estimatedConsumablesCost,
          employeeAllocations: allocatedAmount,
          total: estimatedTotal
        },
        actualCost: {
          hours: actualHoursCost,
          consumables: actualConsumablesCost,
          employeePayments: paidAmount,
          total: actualTotal
        },
        payments: {
          paid: paidAmount,
          pending: pendingAmount,
          total: paidAmount + pendingAmount
        },
        profitLoss: profitLoss,
        profitLossPercentage: profitLossPercentage,
        variance: {
          hoursVariance: actualHoursCost - estimatedHoursCost,
          consumablesVariance: actualConsumablesCost - estimatedConsumablesCost,
          totalVariance: actualTotal - estimatedTotal
        }
      });

      // Add to totals
      totalBudget += projectBudget;
      totalAllocatedToEmployees += allocatedAmount;
      totalPaidToEmployees += paidAmount;
      totalPendingPayments += pendingAmount;
      totalEstimatedCost += estimatedTotal;
      totalActualCost += actualTotal;
    }

    // Overall calculations
    const overallProfitLoss = totalBudget - totalActualCost;
    const overallIncome = totalBudget; // Total project budgets
    const overallExpenses = totalActualCost;
    const netIncome = overallProfitLoss;

    res.status(200).json({
      success: true,
      message: "Financial overview retrieved successfully",
      data: {
        summary: {
          totalProjects: projects.length,
          totalBudget: totalBudget,
          totalAllocatedToEmployees: totalAllocatedToEmployees,
          totalPaidToEmployees: totalPaidToEmployees,
          totalPendingPayments: totalPendingPayments,
          totalEstimatedCost: totalEstimatedCost,
          totalActualCost: totalActualCost,
          overallProfitLoss: overallProfitLoss,
          overallProfitLossPercentage: totalBudget > 0 ? ((overallProfitLoss / totalBudget) * 100).toFixed(2) : 0,
          overallIncome: overallIncome,
          overallExpenses: overallExpenses,
          netIncome: netIncome,
          remainingBudget: totalBudget - totalAllocatedToEmployees
        },
        byStatus: {
          pending: projectFinancials.filter(p => p.status === 'pending' || p.status === '' || p.status === null).length,
          inProgress: projectFinancials.filter(p => p.status === 'in-progress').length,
          completed: projectFinancials.filter(p => p.status === 'completed').length
        },
        projects: projectFinancials
      }
    });

  } catch (error) {
    console.error("Get financial overview error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get detailed profit/loss for a specific project
 */
const handleGetProjectProfitLoss = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({
      where: {
        id: projectId,
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have access"
      });
    }

    // Get all assignments and payments
    const assignments = await ProjectAssignment.findAll({
      where: { projectId },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    const payments = await Payment.findAll({
      where: { projectId },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    // Calculate costs
    const budget = parseFloat(project.budget || 0);
    const estimatedHours = parseFloat(project.estimatedHours || 0);
    const actualHours = parseFloat(project.actualHours || 0);
    const hourlyRate = 50; // Default rate

    const estimatedConsumables = Array.isArray(project.estimatedConsumables)
      ? project.estimatedConsumables.map(item => ({
          name: item.name,
          quantity: item.quantity,
          cost: parseFloat(item.cost || 0)
        }))
      : [];

    const actualConsumables = Array.isArray(project.actualConsumables)
      ? project.actualConsumables.map(item => ({
          name: item.name,
          quantity: item.quantity,
          cost: parseFloat(item.cost || 0)
        }))
      : [];

    const estimatedConsumablesCost = estimatedConsumables.reduce((sum, item) => sum + item.cost, 0);
    const actualConsumablesCost = actualConsumables.reduce((sum, item) => sum + item.cost, 0);

    const estimatedHoursCost = estimatedHours * hourlyRate;
    const actualHoursCost = actualHours * hourlyRate;

    const allocatedToEmployees = parseFloat(project.allocatedAmount || 0);
    const paidToEmployees = payments
      .filter(p => p.requestStatus === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingPayments = payments
      .filter(p => p.requestStatus === 'requested')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Total costs
    const estimatedTotalCost = estimatedHoursCost + estimatedConsumablesCost + allocatedToEmployees;
    const actualTotalCost = actualHoursCost + actualConsumablesCost + paidToEmployees;
    const projectedTotalCost = actualHoursCost + actualConsumablesCost + paidToEmployees + pendingPayments;

    // Profit/Loss calculations
    const currentProfitLoss = budget - actualTotalCost;
    const projectedProfitLoss = budget - projectedTotalCost;
    const estimatedProfitLoss = budget - estimatedTotalCost;

    res.status(200).json({
      success: true,
      message: "Project profit/loss retrieved successfully",
      data: {
        project: {
          id: project.id,
          name: project.name,
          projectType: project.projectType,
          customProjectType: project.customProjectType,
          status: project.status,
          budget: budget,
          currency: project.currency
        },
        estimated: {
          hours: {
            quantity: estimatedHours,
            rate: hourlyRate,
            cost: estimatedHoursCost
          },
          consumables: {
            items: estimatedConsumables,
            totalCost: estimatedConsumablesCost
          },
          employeeAllocations: allocatedToEmployees,
          totalCost: estimatedTotalCost,
          profitLoss: estimatedProfitLoss,
          profitMargin: budget > 0 ? ((estimatedProfitLoss / budget) * 100).toFixed(2) : 0
        },
        actual: {
          hours: {
            quantity: actualHours,
            rate: hourlyRate,
            cost: actualHoursCost
          },
          consumables: {
            items: actualConsumables,
            totalCost: actualConsumablesCost
          },
          employeePayments: paidToEmployees,
          totalCost: actualTotalCost,
          profitLoss: currentProfitLoss,
          profitMargin: budget > 0 ? ((currentProfitLoss / budget) * 100).toFixed(2) : 0
        },
        projected: {
          totalCost: projectedTotalCost,
          pendingPayments: pendingPayments,
          profitLoss: projectedProfitLoss,
          profitMargin: budget > 0 ? ((projectedProfitLoss / budget) * 100).toFixed(2) : 0
        },
        variance: {
          hours: actualHoursCost - estimatedHoursCost,
          consumables: actualConsumablesCost - estimatedConsumablesCost,
          total: actualTotalCost - estimatedTotalCost,
          percentage: estimatedTotalCost > 0 ? (((actualTotalCost - estimatedTotalCost) / estimatedTotalCost) * 100).toFixed(2) : 0
        },
        breakdown: {
          totalAssignments: assignments.length,
          totalPayments: payments.length,
          paidPayments: payments.filter(p => p.requestStatus === 'paid').length,
          pendingPayments: payments.filter(p => p.requestStatus === 'requested').length
        }
      }
    });

  } catch (error) {
    console.error("Get project profit/loss error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get income summary across all projects
 */
const handleGetIncomeSummary = async (req, res) => {
  try {
    const { startDate, endDate, projectType, status } = req.query;

    const whereConditions = {
    };

    if (status) {
      whereConditions.status = status;
    }

    if (projectType && projectType !== 'all') {
      whereConditions.projectType = projectType;
    }

    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const projects = await Project.findAll({
      where: whereConditions
    });

    const projectIds = projects.map(p => p.id);
    const payments = await Payment.findAll({
      where: {
        projectId: {
          [Op.in]: projectIds
        }
      }
    });

    // Calculate income by project type
    const incomeByType = {};
    const incomeByStatus = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      'on-hold': 0,
      cancelled: 0
    };

    let totalRevenue = 0;
    let totalCosts = 0;
    let totalProfit = 0;

    for (const project of projects) {
      const budget = parseFloat(project.budget || 0);
      const actualHoursCost = parseFloat(project.actualHours || 0) * 50;
      const actualConsumablesCost = Array.isArray(project.actualConsumables)
        ? project.actualConsumables.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;
      
      const projectPayments = payments.filter(p => p.projectId === project.id);
      const paidAmount = projectPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const totalCost = actualHoursCost + actualConsumablesCost + paidAmount;
      const profit = budget - totalCost;

      // By type
      const type = project.projectType;
      if (!incomeByType[type]) {
        incomeByType[type] = {
          count: 0,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0
        };
      }
      incomeByType[type].count++;
      incomeByType[type].totalRevenue += budget;
      incomeByType[type].totalCosts += totalCost;
      incomeByType[type].totalProfit += profit;

      // By status
      if (incomeByStatus.hasOwnProperty(project.status)) {
        incomeByStatus[project.status] += budget;
      }

      totalRevenue += budget;
      totalCosts += totalCost;
      totalProfit += profit;
    }

    // Calculate monthly breakdown if date range provided
    let monthlyBreakdown = [];
    if (startDate && endDate) {
      const months = {};
      for (const project of projects) {
        const month = new Date(project.createdAt).toISOString().substring(0, 7); // YYYY-MM
        if (!months[month]) {
          months[month] = {
            month,
            revenue: 0,
            costs: 0,
            profit: 0,
            projectCount: 0
          };
        }
        
        const budget = parseFloat(project.budget || 0);
        const projectPayments = payments.filter(p => p.projectId === project.id && p.requestStatus === 'paid');
        const costs = projectPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        months[month].revenue += budget;
        months[month].costs += costs;
        months[month].profit += (budget - costs);
        months[month].projectCount++;
      }
      monthlyBreakdown = Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
    }

    res.status(200).json({
      success: true,
      message: "Income summary retrieved successfully",
      data: {
        summary: {
          totalProjects: projects.length,
          totalRevenue: totalRevenue,
          totalCosts: totalCosts,
          totalProfit: totalProfit,
          profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
          averageProjectBudget: projects.length > 0 ? (totalRevenue / projects.length).toFixed(2) : 0
        },
        byProjectType: incomeByType,
        byStatus: incomeByStatus,
        monthlyBreakdown: monthlyBreakdown,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          projectType: projectType || 'all',
          status: status || 'all'
        }
      }
    });

  } catch (error) {
    console.error("Get income summary error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get employee allocation tracking
 */
const handleGetEmployeeAllocations = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { }
    });

    const projectIds = projects.map(p => p.id);

    const assignments = await ProjectAssignment.findAll({
      where: {
        projectId: {
          [Op.in]: projectIds
        },
        isActive: true
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
          attributes: ['id', 'name', 'status', 'budget']
        }
      ]
    });

    const payments = await Payment.findAll({
      where: {
        projectId: {
          [Op.in]: projectIds
        }
      }
    });

    // Group by employee
    const employeeAllocations = {};

    for (const assignment of assignments) {
      const empId = assignment.employeeId;
      
      if (!employeeAllocations[empId]) {
        employeeAllocations[empId] = {
          employee: assignment.employee,
          totalAllocated: 0,
          totalPaid: 0,
          totalPending: 0,
          projects: []
        };
      }

      const allocated = parseFloat(assignment.allocatedAmount || 0);
      const projectPayments = payments.filter(p => p.assignmentId === assignment.id);
      const paid = projectPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const pending = projectPayments
        .filter(p => p.requestStatus === 'requested')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      employeeAllocations[empId].totalAllocated += allocated;
      employeeAllocations[empId].totalPaid += paid;
      employeeAllocations[empId].totalPending += pending;
      employeeAllocations[empId].projects.push({
        projectId: assignment.project.id,
        projectName: assignment.project.name,
        projectStatus: assignment.project.status,
        allocated: allocated,
        paid: paid,
        pending: pending,
        workStatus: assignment.workStatus
      });
    }

    const allocationList = Object.values(employeeAllocations);

    // Calculate totals
    const totalAllocated = allocationList.reduce((sum, emp) => sum + emp.totalAllocated, 0);
    const totalPaid = allocationList.reduce((sum, emp) => sum + emp.totalPaid, 0);
    const totalPending = allocationList.reduce((sum, emp) => sum + emp.totalPending, 0);

    res.status(200).json({
      success: true,
      message: "Employee allocations retrieved successfully",
      data: {
        summary: {
          totalEmployees: allocationList.length,
          totalAllocated: totalAllocated,
          totalPaid: totalPaid,
          totalPending: totalPending,
          remainingToAllocate: projects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0) - totalAllocated
        },
        employees: allocationList
      }
    });

  } catch (error) {
    console.error("Get employee allocations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleGetFinancialOverview,
  handleGetProjectProfitLoss,
  handleGetIncomeSummary,
  handleGetEmployeeAllocations
};
