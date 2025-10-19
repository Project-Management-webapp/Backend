const express = require('express');
const router = express.Router();
const {
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
} = require('../../controller/statsController/employeeStatsController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

// Employee statistics routes
router.get('/dashboard', authorizeRoles(['employee', 'intern']), handleGetDashboardStats);
router.get('/earnings-over-time', authorizeRoles(['employee', 'intern']), handleGetEarningsOverTime);
router.get('/assignment-distribution', authorizeRoles(['employee', 'intern']), handleGetAssignmentDistribution);
router.get('/project-performance', authorizeRoles(['employee', 'intern']), handleGetProjectPerformance);
router.get('/payment-distribution', authorizeRoles(['employee', 'intern']), handleGetPaymentDistribution);
router.get('/ticket-trends', authorizeRoles(['employee', 'intern']), handleGetTicketTrends);
router.get('/activity-summary', authorizeRoles(['employee', 'intern']), handleGetActivitySummary);
router.get('/earnings-by-project', authorizeRoles(['employee', 'intern']), handleGetEarningsByProject);
router.get('/completion-rate', authorizeRoles(['employee', 'intern']), handleGetCompletionRate);
router.get('/tickets-by-priority', authorizeRoles(['employee', 'intern']), handleGetTicketsByPriority);

module.exports = router;
