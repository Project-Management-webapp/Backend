const express = require('express');
const router = express.Router();
const {
  handleGetFinancialOverview,
  handleGetProjectProfitLoss,
  handleGetIncomeSummary,
  handleGetEmployeeAllocations,
  handleGetResourceComparison
} = require('../../controller/financeController/financeController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');


// Financial Overview - Total budget, allocated amounts, profit/loss, income summary
router.get('/overview',  authorizeRoles(['manager']), handleGetFinancialOverview);

// Project-specific profit/loss calculation
router.get('/projects/:projectId/profit-loss',  authorizeRoles(['manager']), handleGetProjectProfitLoss);

// Overall income summary for admin
router.get('/income-summary', authorizeRoles(['manager']),handleGetIncomeSummary);

// Track allocated amounts given to employees
router.get('/employee-allocations',   authorizeRoles(['manager']),handleGetEmployeeAllocations);

// Detailed resource comparison and tracking (hours, consumables, materials)
router.get('/projects/:projectId/resource-comparison',  authorizeRoles(['manager']), handleGetResourceComparison);

module.exports = router;
