const Project = require('../../model/projectModel/project');
const Payment = require('../../model/paymentModel/payment');
const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const User = require('../../model/userModel/user');
const { Op } = require('sequelize');
const { sequelize } = require('../../mysqlConnection/dbConnection');


const handleGetFinancialOverview = async (req, res) => {
  try {
    const managerId = req.user.id; // Get logged-in manager's ID
    
    const projects = await Project.findAll({
      where: {
        createdBy: managerId, // Only get projects created by this manager
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
      const hourlyRate = parseFloat(project.rate || 0); 

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
      // Actual cost should ONLY be from Project's actual fields (not include payments)
      const actualTotal = actualHoursCost + actualConsumablesCost + actualMaterialsCost;
      
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
    // const overallIncome = totalBudget; // Total project budgets
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
          // overallIncome: overallIncome,
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
    const managerId = req.user.id; // Get logged-in manager's ID
    const { projectId } = req.params;
    
    const project = await Project.findOne({
      where: {
        id: projectId,
        createdBy: managerId // Only allow access to manager's own projects
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

    // Calculate actual values from project's own fields (not from assignments)
    const actualHours = parseFloat(project.actualHours || 0);
    const actualConsumablesCost = parseFloat(project.actualConsumables || 0);
    const actualMaterialsCost = parseFloat(project.actualMaterials || 0);

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
    // Estimated: based on project's estimated fields
    const estimatedTotalCost = estimatedHoursCost + estimatedConsumablesCost + estimatedMaterialsCost;
    
    // Actual: ONLY from project's actual fields (actualHours * rate + actualConsumables + actualMaterials)
    // Do NOT include payments or assignment data
    const actualTotalCost = actualHoursCost + actualConsumablesCost + actualMaterialsCost;
    
    // Projected: actual costs + pending payments
    const projectedTotalCost = actualTotalCost + pendingPayments;

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
    const managerId = req.user.id; // Get logged-in manager's ID
    const { startDate, endDate, projectType, status } = req.query;

    const whereConditions = {
      createdBy: managerId // Only get projects created by this manager
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
    
    // Get all payments for these projects
    const payments = await Payment.findAll({
      where: {
        projectId: {
          [Op.in]: projectIds
        }
      }
    });

    // Get all assignments for these projects
    const assignments = await ProjectAssignment.findAll({
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
    let totalAllocatedAmount = 0;
    let totalActualAmount = 0;

    for (const project of projects) {
      const budget = parseFloat(project.budget || 0);
      const hourlyRate = parseFloat(project.rate || 0);
      
      // Get actual hours, consumables, and materials from project
      const actualHoursCost = parseFloat(project.actualHours || 0) * hourlyRate;
      const actualConsumablesCost = parseFloat(project.actualConsumables || 0);
      const actualMaterialsCost = parseFloat(project.actualMaterials || 0);
      
      // Get payments for this project
      const projectPayments = payments.filter(p => p.projectId === project.id);
      const paidAmount = projectPayments
        .filter(p => p.requestStatus === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Get assignments data for this project
      const projectAssignments = assignments.filter(a => a.projectId === project.id);
      const allocatedAmount = projectAssignments.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
      const actualAmount = projectAssignments.reduce((sum, a) => {
        const hours = parseFloat(a.actualHours || 0);
        const rate = parseFloat(a.rate || 0);
        const consumables = parseFloat(a.actualConsumables || 0);
        const materials = parseFloat(a.actualMaterials || 0);
        return sum + (hours * rate) + consumables + materials;
      }, 0);

      const totalCost = actualHoursCost + actualConsumablesCost + actualMaterialsCost + paidAmount;
      const profit = budget - totalCost;

      // By type
      const type = project.projectType;
      if (!incomeByType[type]) {
        incomeByType[type] = {
          count: 0,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          totalAllocated: 0,
          totalActual: 0
        };
      }
      incomeByType[type].count++;
      incomeByType[type].totalRevenue += budget;
      incomeByType[type].totalCosts += totalCost;
      incomeByType[type].totalProfit += profit;
      incomeByType[type].totalAllocated += allocatedAmount;
      incomeByType[type].totalActual += actualAmount;

      // By status
      if (incomeByStatus.hasOwnProperty(project.status)) {
        incomeByStatus[project.status] += budget;
      }

      totalRevenue += budget;
      totalCosts += totalCost;
      totalProfit += profit;
      totalAllocatedAmount += allocatedAmount;
      totalActualAmount += actualAmount;
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
            projectCount: 0,
            allocatedAmount: 0,
            actualAmount: 0
          };
        }
        
        const budget = parseFloat(project.budget || 0);
        const projectPayments = payments.filter(p => p.projectId === project.id && p.requestStatus === 'paid');
        const costs = projectPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        // Get assignment amounts for this project
        const projectAssignments = assignments.filter(a => a.projectId === project.id);
        const allocatedAmount = projectAssignments.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
        const actualAmount = projectAssignments.reduce((sum, a) => {
          const hours = parseFloat(a.actualHours || 0);
          const rate = parseFloat(a.rate || 0);
          const consumables = parseFloat(a.actualConsumables || 0);
          const materials = parseFloat(a.actualMaterials || 0);
          return sum + (hours * rate) + consumables + materials;
        }, 0);
        
        months[month].revenue += budget;
        months[month].costs += costs;
        months[month].profit += (budget - costs);
        months[month].projectCount++;
        months[month].allocatedAmount += allocatedAmount;
        months[month].actualAmount += actualAmount;
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
          averageProjectBudget: projects.length > 0 ? (totalRevenue / projects.length).toFixed(2) : 0,
          totalAllocatedAmount: totalAllocatedAmount,
          totalActualAmount: totalActualAmount
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
    const managerId = req.user.id; // Get logged-in manager's ID
    
    const projects = await Project.findAll({
      where: { createdBy: managerId } // Only get projects created by this manager
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
          attributes: ['id', 'name', 'status', 'budget', 'rate', 'estimatedHours', 'actualHours', 'estimatedConsumables', 'actualConsumables', 'estimatedMaterials', 'actualMaterials']
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

      // Assignment-level tracking metrics
      const estHours = parseFloat(assignment.estimatedHours || 0);
      const actHours = parseFloat(assignment.actualHours || 0);
      const assignmentRate = parseFloat(assignment.rate || 0);
      
      // Assignment-level costs (DECIMAL fields)
      const estConsumables = parseFloat(assignment.estimatedConsumables || 0);
      const actConsumables = parseFloat(assignment.actualConsumables || 0);
      const estMaterials = parseFloat(assignment.estimatedMaterials || 0);
      const actMaterials = parseFloat(assignment.actualMaterials || 0);

      // Calculate assignment-level total costs
      const assignmentEstimatedHoursCost = estHours * assignmentRate;
      const assignmentActualHoursCost = actHours * assignmentRate;
      const assignmentEstimatedTotalCost = assignmentEstimatedHoursCost + estConsumables + estMaterials;
      const assignmentActualTotalCost = assignmentActualHoursCost + actConsumables + actMaterials;

      // Project-level tracking metrics
      const projectRate = parseFloat(assignment.project.rate || 0);
      const projectEstHours = parseFloat(assignment.project.estimatedHours || 0);
      const projectActHours = parseFloat(assignment.project.actualHours || 0);
      const projectEstConsumables = parseFloat(assignment.project.estimatedConsumables || 0);
      const projectActConsumables = parseFloat(assignment.project.actualConsumables || 0);
      const projectEstMaterials = parseFloat(assignment.project.estimatedMaterials || 0);
      const projectActMaterials = parseFloat(assignment.project.actualMaterials || 0);

      // Calculate project-level total costs
      const projectEstimatedHoursCost = projectEstHours * projectRate;
      const projectActualHoursCost = projectActHours * projectRate;
      const projectEstimatedTotalCost = projectEstimatedHoursCost + projectEstConsumables + projectEstMaterials;
      const projectActualTotalCost = projectActualHoursCost + projectActConsumables + projectActMaterials;

      employeeAllocations[empId].totalAllocated += allocated;
      employeeAllocations[empId].totalPaid += paid;
      employeeAllocations[empId].totalPending += pending;
      employeeAllocations[empId].projects.push({
        projectId: assignment.project.id,
        projectName: assignment.project.name,
        projectStatus: assignment.project.status,
        projectBudget: parseFloat(assignment.project.budget || 0),
        role: assignment.role,
        allocated: allocated,
        paid: paid,
        pending: pending,
        workStatus: assignment.workStatus,
        assignmentLevel: {
          estimatedHours: estHours,
          actualHours: actHours,
          rate: assignmentRate,
          hoursVariance: actHours - estHours,
          hoursUtilization: estHours > 0 ? ((actHours / estHours) * 100).toFixed(2) : 0,
          costs: {
            estimated: {
              hours: assignmentEstimatedHoursCost,
              consumables: estConsumables,
              materials: estMaterials,
              total: assignmentEstimatedTotalCost
            },
            actual: {
              hours: assignmentActualHoursCost,
              consumables: actConsumables,
              materials: actMaterials,
              total: assignmentActualTotalCost
            }
          },
          variance: {
            hours: actHours - estHours,
            hoursPercentage: estHours > 0 ? (((actHours - estHours) / estHours) * 100).toFixed(2) : 0,
            consumables: actConsumables - estConsumables,
            consumablesPercentage: estConsumables > 0 ? (((actConsumables - estConsumables) / estConsumables) * 100).toFixed(2) : 0,
            materials: actMaterials - estMaterials,
            materialsPercentage: estMaterials > 0 ? (((actMaterials - estMaterials) / estMaterials) * 100).toFixed(2) : 0,
            totalCost: assignmentActualTotalCost - assignmentEstimatedTotalCost,
            totalCostPercentage: assignmentEstimatedTotalCost > 0 ? (((assignmentActualTotalCost - assignmentEstimatedTotalCost) / assignmentEstimatedTotalCost) * 100).toFixed(2) : 0
          }
        },
        projectLevel: {
          estimatedHours: projectEstHours,
          actualHours: projectActHours,
          rate: projectRate,
          hoursVariance: projectActHours - projectEstHours,
          hoursUtilization: projectEstHours > 0 ? ((projectActHours / projectEstHours) * 100).toFixed(2) : 0,
          costs: {
            estimated: {
              hours: projectEstimatedHoursCost,
              consumables: projectEstConsumables,
              materials: projectEstMaterials,
              total: projectEstimatedTotalCost
            },
            actual: {
              hours: projectActualHoursCost,
              consumables: projectActConsumables,
              materials: projectActMaterials,
              total: projectActualTotalCost
            }
          },
          variance: {
            hours: projectActHours - projectEstHours,
            hoursPercentage: projectEstHours > 0 ? (((projectActHours - projectEstHours) / projectEstHours) * 100).toFixed(2) : 0,
            consumables: projectActConsumables - projectEstConsumables,
            consumablesPercentage: projectEstConsumables > 0 ? (((projectActConsumables - projectEstConsumables) / projectEstConsumables) * 100).toFixed(2) : 0,
            materials: projectActMaterials - projectEstMaterials,
            materialsPercentage: projectEstMaterials > 0 ? (((projectActMaterials - projectEstMaterials) / projectEstMaterials) * 100).toFixed(2) : 0,
            totalCost: projectActualTotalCost - projectEstimatedTotalCost,
            totalCostPercentage: projectEstimatedTotalCost > 0 ? (((projectActualTotalCost - projectEstimatedTotalCost) / projectEstimatedTotalCost) * 100).toFixed(2) : 0
          }
        },
        performance: {
          completionRate: allocated > 0 ? ((paid / allocated) * 100).toFixed(2) : 0,
          efficiency: estHours > 0 && actHours > 0 ? ((estHours / actHours) * 100).toFixed(2) : 0,
          costEfficiency: assignmentEstimatedTotalCost > 0 && assignmentActualTotalCost > 0 ? ((assignmentEstimatedTotalCost / assignmentActualTotalCost) * 100).toFixed(2) : 0
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


const handleGetResourceComparison = async (req, res) => {
  try {
    const managerId = req.user.id; // Get logged-in manager's ID
    const { projectId } = req.params;
    
    const project = await Project.findOne({
      where: { 
        id: projectId,
        createdBy: managerId // Only allow access to manager's own projects
      },
      attributes: [
        'id', 'name', 'status', 'budget', 
        'estimatedHours', 'actualHours',
        'estimatedConsumables', 'actualConsumables',
        'estimatedMaterials', 'actualMaterials',
        'rate'
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }
    
    
    const assignments = await ProjectAssignment.findAll({
      where: { projectId },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'fullName', 'email', 'position']
      }]
    });

    // Get values from PROJECT MODEL ONLY (Manager updates these via handleUpdateProject)
    const projectEstimatedHours = parseFloat(project.estimatedHours || 0);
    const projectActualHours = parseFloat(project.actualHours || 0);
    const projectEstimatedConsumablesCost = parseFloat(project.estimatedConsumables || 0);
    const projectActualConsumablesCost = parseFloat(project.actualConsumables || 0);
    const projectEstimatedMaterialsCost = parseFloat(project.estimatedMaterials || 0);
    const projectActualMaterialsCost = parseFloat(project.actualMaterials || 0);
    const hourlyRate = parseFloat(project.rate || 0);

    // Calculate costs from PROJECT fields
    const projectEstimatedHoursCost = projectEstimatedHours * hourlyRate;
    const projectActualHoursCost = projectActualHours * hourlyRate;

    // Project-level tracking (from PROJECT model)
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
        estimatedCost: projectEstimatedHoursCost,
        actualCost: projectActualHoursCost
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

    // Assignment-level tracking (for individual employee breakdown only)
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
        totalAllocation: parseFloat(assignment.allocatedAmount || 0),
        actualAmount: parseFloat(assignment.actualAmount || 0) // Amount updated by manager during payment approval
      };
    });

    // Calculate total costs from PROJECT fields (not from assignments)
    const totalEstimatedCost = projectEstimatedHoursCost + projectEstimatedConsumablesCost + projectEstimatedMaterialsCost;
    const totalActualCost = projectActualHoursCost + projectActualConsumablesCost + projectActualMaterialsCost;

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
            // Note: These are from PROJECT level, not aggregated from assignments
            totalEstimatedHours: projectEstimatedHours,
            totalActualHours: projectActualHours,
            hoursVariance: projectActualHours - projectEstimatedHours,
            hoursVariancePercentage: projectEstimatedHours > 0 
              ? (((projectActualHours - projectEstimatedHours) / projectEstimatedHours) * 100).toFixed(2)
              : 0,
            totalEstimatedHoursCost: projectEstimatedHoursCost,
            totalActualHoursCost: projectActualHoursCost,
            totalEstimatedConsumables: projectEstimatedConsumablesCost,
            totalActualConsumables: projectActualConsumablesCost,
            consumablesVariance: projectActualConsumablesCost - projectEstimatedConsumablesCost,
            consumablesVariancePercentage: projectEstimatedConsumablesCost > 0 
              ? (((projectActualConsumablesCost - projectEstimatedConsumablesCost) / projectEstimatedConsumablesCost) * 100).toFixed(2)
              : 0,
            totalEstimatedMaterials: projectEstimatedMaterialsCost,
            totalActualMaterials: projectActualMaterialsCost,
            materialsVariance: projectActualMaterialsCost - projectEstimatedMaterialsCost,
            materialsVariancePercentage: projectEstimatedMaterialsCost > 0 
              ? (((projectActualMaterialsCost - projectEstimatedMaterialsCost) / projectEstimatedMaterialsCost) * 100).toFixed(2)
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
          // All based on PROJECT level data
          overallEfficiency: projectEstimatedHours > 0 && projectActualHours > 0 
            ? ((projectEstimatedHours / projectActualHours) * 100).toFixed(2) 
            : 0,
          consumablesAccuracy: projectEstimatedConsumablesCost > 0 
            ? (100 - Math.abs(((projectActualConsumablesCost - projectEstimatedConsumablesCost) / projectEstimatedConsumablesCost) * 100)).toFixed(2)
            : 0,
          materialsAccuracy: projectEstimatedMaterialsCost > 0 
            ? (100 - Math.abs(((projectActualMaterialsCost - projectEstimatedMaterialsCost) / projectEstimatedMaterialsCost) * 100)).toFixed(2)
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
