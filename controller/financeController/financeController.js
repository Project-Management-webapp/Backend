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
      const hourlyRate = parseFloat(project.rate || 0); // Dynamic rate from project

      // Calculate estimated costs (hours + consumables + materials)
      const estimatedHoursCost = parseFloat(project.estimatedHours || 0) * hourlyRate;
      const estimatedConsumablesCost = parseFloat(project.estimatedConsumables || 0);
      const estimatedMaterialsCost = parseFloat(project.estimatedMaterials || 0);

      // Calculate actual costs (hours + consumables + materials)
      const actualHoursCost = parseFloat(project.actualHours || 0) * hourlyRate;
      const actualConsumablesCost = parseFloat(project.actualConsumables || 0);
      const actualMaterialsCost = parseFloat(project.actualMaterials || 0);

      // Get payments for this project
      const projectPayments = payments.filter(p => p.projectId === project.id);
      const paidAmount = projectPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      const pendingAmount = projectPayments
        .filter(p => p.requestStatus === 'requested')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const estimatedTotal = estimatedHoursCost + estimatedConsumablesCost + estimatedMaterialsCost;
      const actualTotal = actualHoursCost + actualConsumablesCost + actualMaterialsCost + paidAmount;
      
      // Profit/Loss = Budget - Actual Costs
      const profitLoss = projectBudget - actualTotal;
      const profitLossPercentage = projectBudget > 0 ? ((profitLoss / projectBudget) * 100).toFixed(2) : 0;

      // Calculate tracking metrics
      const hoursVariance = actualHoursCost - estimatedHoursCost;
      const hoursVariancePercentage = estimatedHoursCost > 0 ? ((hoursVariance / estimatedHoursCost) * 100).toFixed(2) : 0;
      const consumablesVariance = actualConsumablesCost - estimatedConsumablesCost;
      const consumablesVariancePercentage = estimatedConsumablesCost > 0 ? ((consumablesVariance / estimatedConsumablesCost) * 100).toFixed(2) : 0;
      const materialsVariance = actualMaterialsCost - estimatedMaterialsCost;
      const materialsVariancePercentage = estimatedMaterialsCost > 0 ? ((materialsVariance / estimatedMaterialsCost) * 100).toFixed(2) : 0;

      projectFinancials.push({
        projectId: project.id,
        projectName: project.name,
        projectType: project.projectType,
        customProjectType: project.customProjectType,
        status: project.status,
        budget: projectBudget,
        allocatedToEmployees: allocatedAmount,
        tracking: {
          estimatedHours: parseFloat(project.estimatedHours || 0),
          actualHours: parseFloat(project.actualHours || 0),
          hoursVariance: parseFloat(project.actualHours || 0) - parseFloat(project.estimatedHours || 0),
          hoursUtilization: parseFloat(project.estimatedHours || 0) > 0 
            ? ((parseFloat(project.actualHours || 0) / parseFloat(project.estimatedHours || 0)) * 100).toFixed(2) 
            : 0
        },
        estimatedCost: {
          hours: estimatedHoursCost,
          consumables: estimatedConsumablesCost,
          materials: estimatedMaterialsCost,
          employeeAllocations: allocatedAmount,
          total: estimatedTotal
        },
        actualCost: {
          hours: actualHoursCost,
          consumables: actualConsumablesCost,
          materials: actualMaterialsCost,
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
          hours: {
            amount: hoursVariance,
            percentage: hoursVariancePercentage,
            status: hoursVariance > 0 ? 'over' : hoursVariance < 0 ? 'under' : 'on-track'
          },
          consumables: {
            amount: consumablesVariance,
            percentage: consumablesVariancePercentage,
            status: consumablesVariance > 0 ? 'over' : consumablesVariance < 0 ? 'under' : 'on-track'
          },
          materials: {
            amount: materialsVariance,
            percentage: materialsVariancePercentage,
            status: materialsVariance > 0 ? 'over' : materialsVariance < 0 ? 'under' : 'on-track'
          },
          totalVariance: actualTotal - estimatedTotal,
          totalVariancePercentage: estimatedTotal > 0 ? (((actualTotal - estimatedTotal) / estimatedTotal) * 100).toFixed(2) : 0
        },
        efficiency: {
          budgetUtilization: projectBudget > 0 ? ((actualTotal / projectBudget) * 100).toFixed(2) : 0,
          costPerformanceIndex: estimatedTotal > 0 ? (estimatedTotal / actualTotal).toFixed(2) : 0, // CPI > 1 = under budget
          schedulePerformanceIndex: parseFloat(project.estimatedHours || 0) > 0 
            ? (parseFloat(project.estimatedHours || 0) / parseFloat(project.actualHours || 1)).toFixed(2) 
            : 0 // SPI > 1 = ahead of schedule
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

    // Calculate costs from project (estimated values)
    const budget = parseFloat(project.budget || 0);
    const estimatedHours = parseFloat(project.estimatedHours || 0);
    const hourlyRate = parseFloat(project.rate || 0); // Dynamic rate from project
    const estimatedConsumablesCost = parseFloat(project.estimatedConsumables || 0);
    const estimatedMaterialsCost = parseFloat(project.estimatedMaterials || 0);

    // Calculate actual values from sum of all assignments
    let actualHours = 0;
    let actualConsumablesCost = 0;
    let actualMaterialsCost = 0;

    assignments.forEach(assignment => {
      actualHours += parseFloat(assignment.actualHours || 0);
      actualConsumablesCost += parseFloat(assignment.actualConsumables || 0);
      actualMaterialsCost += parseFloat(assignment.actualMaterials || 0);
    });

    const estimatedHoursCost = estimatedHours * hourlyRate;
    const actualHoursCost = actualHours * hourlyRate;

    const allocatedToEmployees = parseFloat(project.allocatedAmount || 0);
    const paidToEmployees = payments
      .filter(p => p.requestStatus === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingPayments = payments
      .filter(p => p.requestStatus === 'requested')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Total costs (matching project creation formula)
    const estimatedTotalCost = estimatedHoursCost + estimatedConsumablesCost + estimatedMaterialsCost;
    const actualTotalCost = actualHoursCost + actualConsumablesCost + actualMaterialsCost + paidToEmployees;
    const projectedTotalCost = actualHoursCost + actualConsumablesCost + actualMaterialsCost + paidToEmployees + pendingPayments;

    // Profit/Loss calculations
    const currentProfitLoss = budget - actualTotalCost;
    const projectedProfitLoss = budget - projectedTotalCost;
    const estimatedProfitLoss = budget - estimatedTotalCost;

    // Calculate assignment-level tracking
    const assignmentTracking = assignments.map(assignment => {
      const assignmentPayments = payments.filter(p => p.assignmentId === assignment.id);
      const assignmentPaid = assignmentPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const assignmentPending = assignmentPayments
        .filter(p => p.requestStatus === 'requested')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const estHours = parseFloat(assignment.estimatedHours || 0);
      const actHours = parseFloat(assignment.actualHours || 0);
      const estConsumables = parseFloat(assignment.estimatedConsumables || 0);
      const actConsumables = parseFloat(assignment.actualConsumables || 0);
      const estMaterials = parseFloat(assignment.estimatedMaterials || 0);
      const actMaterials = parseFloat(assignment.actualMaterials || 0);

      return {
        assignmentId: assignment.id,
        employee: assignment.employee,
        role: assignment.role,
        workStatus: assignment.workStatus,
        tracking: {
          estimatedHours: estHours,
          actualHours: actHours,
          hoursVariance: actHours - estHours,
          hoursUtilization: estHours > 0 ? ((actHours / estHours) * 100).toFixed(2) : 0
        },
        costs: {
          allocated: parseFloat(assignment.allocatedAmount || 0),
          paid: assignmentPaid,
          pending: assignmentPending,
          estimatedConsumables: estConsumables,
          actualConsumables: actConsumables,
          estimatedMaterials: estMaterials,
          actualMaterials: actMaterials
        },
        variance: {
          consumables: actConsumables - estConsumables,
          materials: actMaterials - estMaterials
        }
      };
    });

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
          currency: project.currency,
          startDate: project.startDate,
          deadline: project.deadline,
          actualStartDate: project.actualStartDate,
          actualEndDate: project.actualEndDate
        },
        tracking: {
          hours: {
            estimated: estimatedHours,
            actual: actualHours,
            variance: actualHours - estimatedHours,
            variancePercentage: estimatedHours > 0 ? (((actualHours - estimatedHours) / estimatedHours) * 100).toFixed(2) : 0,
            efficiency: estimatedHours > 0 && actualHours > 0 ? ((estimatedHours / actualHours) * 100).toFixed(2) : 0
          },
          timeline: {
            planned: project.startDate && project.deadline 
              ? Math.ceil((new Date(project.deadline) - new Date(project.startDate)) / (1000 * 60 * 60 * 24))
              : 0,
            actual: project.actualStartDate && project.actualEndDate
              ? Math.ceil((new Date(project.actualEndDate) - new Date(project.actualStartDate)) / (1000 * 60 * 60 * 24))
              : 0
          }
        },
        estimated: {
          hours: {
            quantity: estimatedHours,
            rate: hourlyRate,
            cost: estimatedHoursCost
          },
          consumables: {
            totalCost: estimatedConsumablesCost
          },
          materials: {
            totalCost: estimatedMaterialsCost
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
            totalCost: actualConsumablesCost
          },
          materials: {
            totalCost: actualMaterialsCost
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
          hours: {
            amount: actualHoursCost - estimatedHoursCost,
            percentage: estimatedHoursCost > 0 ? (((actualHoursCost - estimatedHoursCost) / estimatedHoursCost) * 100).toFixed(2) : 0
          },
          consumables: {
            amount: actualConsumablesCost - estimatedConsumablesCost,
            percentage: estimatedConsumablesCost > 0 ? (((actualConsumablesCost - estimatedConsumablesCost) / estimatedConsumablesCost) * 100).toFixed(2) : 0
          },
          materials: {
            amount: actualMaterialsCost - estimatedMaterialsCost,
            percentage: estimatedMaterialsCost > 0 ? (((actualMaterialsCost - estimatedMaterialsCost) / estimatedMaterialsCost) * 100).toFixed(2) : 0
          },
          total: {
            amount: actualTotalCost - estimatedTotalCost,
            percentage: estimatedTotalCost > 0 ? (((actualTotalCost - estimatedTotalCost) / estimatedTotalCost) * 100).toFixed(2) : 0
          }
        },
        performanceMetrics: {
          costPerformanceIndex: estimatedTotalCost > 0 && actualTotalCost > 0 ? (estimatedTotalCost / actualTotalCost).toFixed(2) : 0, // >1 under budget, <1 over budget
          schedulePerformanceIndex: estimatedHours > 0 && actualHours > 0 ? (estimatedHours / actualHours).toFixed(2) : 0, // >1 ahead, <1 behind
          budgetUtilization: budget > 0 ? ((actualTotalCost / budget) * 100).toFixed(2) : 0,
          remainingBudget: budget - actualTotalCost,
          burnRate: actualHours > 0 ? (actualTotalCost / actualHours).toFixed(2) : 0 // Cost per hour
        },
        breakdown: {
          totalAssignments: assignments.length,
          totalPayments: payments.length,
          paidPayments: payments.filter(p => p.requestStatus === 'paid').length,
          pendingPayments: payments.filter(p => p.requestStatus === 'requested').length
        },
        assignmentTracking: assignmentTracking
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
      const actualMaterialsCost = Array.isArray(project.actualMaterials)
        ? project.actualMaterials.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;
      
      const projectPayments = payments.filter(p => p.projectId === project.id);
      const paidAmount = projectPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const totalCost = actualHoursCost + actualConsumablesCost + actualMaterialsCost + paidAmount;
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

      // Calculate tracking metrics
      const estHours = parseFloat(assignment.estimatedHours || 0);
      const actHours = parseFloat(assignment.actualHours || 0);
      const estConsumables = Array.isArray(assignment.estimatedConsumables)
        ? assignment.estimatedConsumables.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;
      const actConsumables = Array.isArray(assignment.actualConsumables)
        ? assignment.actualConsumables.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;
      const estMaterials = Array.isArray(assignment.estimatedMaterials)
        ? assignment.estimatedMaterials.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;
      const actMaterials = Array.isArray(assignment.actualMaterials)
        ? assignment.actualMaterials.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0)
        : 0;

      employeeAllocations[empId].totalAllocated += allocated;
      employeeAllocations[empId].totalPaid += paid;
      employeeAllocations[empId].totalPending += pending;
      employeeAllocations[empId].projects.push({
        projectId: assignment.project.id,
        projectName: assignment.project.name,
        projectStatus: assignment.project.status,
        role: assignment.role,
        allocated: allocated,
        paid: paid,
        pending: pending,
        workStatus: assignment.workStatus,
        tracking: {
          estimatedHours: estHours,
          actualHours: actHours,
          hoursVariance: actHours - estHours,
          hoursUtilization: estHours > 0 ? ((actHours / estHours) * 100).toFixed(2) : 0,
          consumables: {
            estimated: estConsumables,
            actual: actConsumables,
            variance: actConsumables - estConsumables
          },
          materials: {
            estimated: estMaterials,
            actual: actMaterials,
            variance: actMaterials - estMaterials
          }
        },
        performance: {
          completionRate: allocated > 0 ? ((paid / allocated) * 100).toFixed(2) : 0,
          efficiency: estHours > 0 && actHours > 0 ? ((estHours / actHours) * 100).toFixed(2) : 0
        }
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

/**
 * Get detailed resource comparison and tracking
 */
const handleGetResourceComparison = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findOne({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Get all assignments for detailed breakdown
    const assignments = await ProjectAssignment.findAll({
      where: { projectId },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'fullName', 'email', 'position']
      }]
    });

    // Calculate actual values from sum of all assignments (dynamic)
    let projectActualHours = 0;
    let projectActualConsumablesCost = 0;
    let projectActualMaterialsCost = 0;

    assignments.forEach(assignment => {
      projectActualHours += parseFloat(assignment.actualHours || 0);
      projectActualConsumablesCost += parseFloat(assignment.actualConsumables || 0);
      projectActualMaterialsCost += parseFloat(assignment.actualMaterials || 0);
    });

    // Get estimated values from project model
    const projectEstimatedHours = parseFloat(project.estimatedHours || 0);
    const projectEstimatedConsumablesCost = parseFloat(project.estimatedConsumables || 0);
    const projectEstimatedMaterialsCost = parseFloat(project.estimatedMaterials || 0);
    const hourlyRate = parseFloat(project.rate || 0);

    // Project-level tracking (all dynamic)
    const projectTracking = {
      hours: {
        estimated: projectEstimatedHours,
        actual: projectActualHours,
        variance: projectActualHours - projectEstimatedHours,
        variancePercentage: projectEstimatedHours > 0 
          ? (((projectActualHours - projectEstimatedHours) / projectEstimatedHours) * 100).toFixed(2)
          : 0,
        status: projectActualHours > projectEstimatedHours ? 'over' : projectActualHours < projectEstimatedHours ? 'under' : 'on-track',
        rate: hourlyRate,
        estimatedCost: projectEstimatedHours * hourlyRate,
        actualCost: projectActualHours * hourlyRate
      },
      consumables: {
        estimatedCost: projectEstimatedConsumablesCost,
        actualCost: projectActualConsumablesCost,
        variance: projectActualConsumablesCost - projectEstimatedConsumablesCost,
        variancePercentage: projectEstimatedConsumablesCost > 0 
          ? (((projectActualConsumablesCost - projectEstimatedConsumablesCost) / projectEstimatedConsumablesCost) * 100).toFixed(2)
          : 0,
        status: projectActualConsumablesCost > projectEstimatedConsumablesCost ? 'over' : projectActualConsumablesCost < projectEstimatedConsumablesCost ? 'under' : 'on-track'
      },
      materials: {
        estimatedCost: projectEstimatedMaterialsCost,
        actualCost: projectActualMaterialsCost,
        variance: projectActualMaterialsCost - projectEstimatedMaterialsCost,
        variancePercentage: projectEstimatedMaterialsCost > 0 
          ? (((projectActualMaterialsCost - projectEstimatedMaterialsCost) / projectEstimatedMaterialsCost) * 100).toFixed(2)
          : 0,
        status: projectActualMaterialsCost > projectEstimatedMaterialsCost ? 'over' : projectActualMaterialsCost < projectEstimatedMaterialsCost ? 'under' : 'on-track'
      }
    };

    // Assignment-level tracking (dynamic)
    const assignmentTracking = assignments.map(assignment => {
      const estHours = parseFloat(assignment.estimatedHours || 0);
      const actHours = parseFloat(assignment.actualHours || 0);
      const rate = parseFloat(assignment.rate || 0);
      
      // Actual values are DECIMAL fields in database
      const estConsumablesCost = parseFloat(assignment.estimatedConsumables || 0);
      const actConsumablesCost = parseFloat(assignment.actualConsumables || 0);
      const estMaterialsCost = parseFloat(assignment.estimatedMaterials || 0);
      const actMaterialsCost = parseFloat(assignment.actualMaterials || 0);

      return {
        assignmentId: assignment.id,
        employee: assignment.employee,
        role: assignment.role,
        workStatus: assignment.workStatus,
        hours: {
          estimated: estHours,
          actual: actHours,
          variance: actHours - estHours,
          variancePercentage: estHours > 0 ? (((actHours - estHours) / estHours) * 100).toFixed(2) : 0,
          efficiency: estHours > 0 && actHours > 0 ? ((estHours / actHours) * 100).toFixed(2) : 0,
          rate: rate,
          estimatedCost: estHours * rate,
          actualCost: actHours * rate
        },
        consumables: {
          estimatedCost: estConsumablesCost,
          actualCost: actConsumablesCost,
          variance: actConsumablesCost - estConsumablesCost,
          variancePercentage: estConsumablesCost > 0 ? (((actConsumablesCost - estConsumablesCost) / estConsumablesCost) * 100).toFixed(2) : 0,
          status: actConsumablesCost > estConsumablesCost ? 'over' : actConsumablesCost < estConsumablesCost ? 'under' : 'on-track'
        },
        materials: {
          estimatedCost: estMaterialsCost,
          actualCost: actMaterialsCost,
          variance: actMaterialsCost - estMaterialsCost,
          variancePercentage: estMaterialsCost > 0 ? (((actMaterialsCost - estMaterialsCost) / estMaterialsCost) * 100).toFixed(2) : 0,
          status: actMaterialsCost > estMaterialsCost ? 'over' : actMaterialsCost < estMaterialsCost ? 'under' : 'on-track'
        },
        totalAllocation: parseFloat(assignment.allocatedAmount || 0)
      };
    });

    // Calculate summary statistics from assignments (dynamic aggregation)
    const totalEstimatedHours = assignmentTracking.reduce((sum, a) => sum + a.hours.estimated, 0);
    const totalActualHours = assignmentTracking.reduce((sum, a) => sum + a.hours.actual, 0);
    const totalEstimatedConsumables = assignmentTracking.reduce((sum, a) => sum + a.consumables.estimatedCost, 0);
    const totalActualConsumables = assignmentTracking.reduce((sum, a) => sum + a.consumables.actualCost, 0);
    const totalEstimatedMaterials = assignmentTracking.reduce((sum, a) => sum + a.materials.estimatedCost, 0);
    const totalActualMaterials = assignmentTracking.reduce((sum, a) => sum + a.materials.actualCost, 0);
    const totalEstimatedHoursCost = assignmentTracking.reduce((sum, a) => sum + a.hours.estimatedCost, 0);
    const totalActualHoursCost = assignmentTracking.reduce((sum, a) => sum + a.hours.actualCost, 0);

    // Calculate total costs
    const totalEstimatedCost = totalEstimatedHoursCost + totalEstimatedConsumables + totalEstimatedMaterials;
    const totalActualCost = totalActualHoursCost + totalActualConsumables + totalActualMaterials;

    res.status(200).json({
      success: true,
      message: "Resource comparison retrieved successfully",
      data: {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          budget: parseFloat(project.budget || 0)
        },
        projectLevel: projectTracking,
        assignmentLevel: {
          summary: {
            totalAssignments: assignments.length,
            totalEstimatedHours,
            totalActualHours,
            hoursVariance: totalActualHours - totalEstimatedHours,
            hoursVariancePercentage: totalEstimatedHours > 0 
              ? (((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100).toFixed(2)
              : 0,
            totalEstimatedHoursCost,
            totalActualHoursCost,
            totalEstimatedConsumables,
            totalActualConsumables,
            consumablesVariance: totalActualConsumables - totalEstimatedConsumables,
            consumablesVariancePercentage: totalEstimatedConsumables > 0 
              ? (((totalActualConsumables - totalEstimatedConsumables) / totalEstimatedConsumables) * 100).toFixed(2)
              : 0,
            totalEstimatedMaterials,
            totalActualMaterials,
            materialsVariance: totalActualMaterials - totalEstimatedMaterials,
            materialsVariancePercentage: totalEstimatedMaterials > 0 
              ? (((totalActualMaterials - totalEstimatedMaterials) / totalEstimatedMaterials) * 100).toFixed(2)
              : 0,
            totalEstimatedCost,
            totalActualCost,
            totalCostVariance: totalActualCost - totalEstimatedCost,
            totalCostVariancePercentage: totalEstimatedCost > 0 
              ? (((totalActualCost - totalEstimatedCost) / totalEstimatedCost) * 100).toFixed(2)
              : 0
          },
          assignments: assignmentTracking
        },
        performanceIndicators: {
          overallEfficiency: totalEstimatedHours > 0 && totalActualHours > 0 
            ? ((totalEstimatedHours / totalActualHours) * 100).toFixed(2) 
            : 0,
          consumablesAccuracy: totalEstimatedConsumables > 0 
            ? (100 - Math.abs(((totalActualConsumables - totalEstimatedConsumables) / totalEstimatedConsumables) * 100)).toFixed(2)
            : 0,
          materialsAccuracy: totalEstimatedMaterials > 0 
            ? (100 - Math.abs(((totalActualMaterials - totalEstimatedMaterials) / totalEstimatedMaterials) * 100)).toFixed(2)
            : 0,
          costPerformanceIndex: totalEstimatedCost > 0 && totalActualCost > 0 
            ? (totalEstimatedCost / totalActualCost).toFixed(2)
            : 0, // CPI > 1 = under budget, < 1 = over budget
          budgetUtilization: parseFloat(project.budget || 0) > 0 
            ? ((totalActualCost / parseFloat(project.budget || 0)) * 100).toFixed(2)
            : 0
        }
      }
    });

  } catch (error) {
    console.error("Get resource comparison error:", error);
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
  handleGetEmployeeAllocations,
  handleGetResourceComparison
};
