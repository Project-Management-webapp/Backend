const express = require('express');
const router = express.Router();
const {
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
} = require('../../controller/statsController/managerStatsController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

// Manager statistics routes
router.get('/dashboard', authorizeRoles(['manager', 'admin']), handleGetDashboardStats);
router.get('/project-distribution', authorizeRoles(['manager', 'admin']), handleGetProjectDistribution);
router.get('/payment-trends', authorizeRoles(['manager', 'admin']), handleGetPaymentTrends);
router.get('/team-performance', authorizeRoles(['manager', 'admin']), handleGetTeamPerformance);
router.get('/project-progress', authorizeRoles(['manager', 'admin']), handleGetProjectProgress);
router.get('/budget-utilization', authorizeRoles(['manager', 'admin']), handleGetBudgetUtilization);
router.get('/assignment-trends', authorizeRoles(['manager', 'admin']), handleGetAssignmentTrends);
router.get('/ticket-resolution', authorizeRoles(['manager', 'admin']), handleGetTicketResolutionStats);
router.get('/workload-distribution', authorizeRoles(['manager', 'admin']), handleGetWorkloadDistribution);
router.get('/activity-summary', authorizeRoles(['manager', 'admin']), handleGetActivitySummary);
router.get('/payment-queue', authorizeRoles(['manager', 'admin']), handleGetPaymentQueue);

module.exports = router;
