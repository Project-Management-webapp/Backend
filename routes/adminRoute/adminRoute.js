const express = require('express');
const { checkForAuthenticationCookie } = require('../../middleware/authMiddleware');
const { authorizeRoles } = require('../../middleware/roleMiddleware');
const {
  handleGetAllManagers,
  handleGetManagerById,
  handleGetPendingManagers,
  handleApproveManager,
  handleRejectManager,
  handleGetAllEmployees,
  handleGetSystemStats
} = require('../../controller/adminController/adminController');

const router = express.Router();

// All routes require authentication and admin role
router.use(checkForAuthenticationCookie());
router.use(authorizeRoles(['admin']));

// Manager management routes
router.get('/managers', handleGetAllManagers);
router.get('/managers/pending', handleGetPendingManagers);
router.get('/managers/:managerId', handleGetManagerById);
router.put('/managers/:managerId/approve', handleApproveManager);
router.put('/managers/:managerId/reject', handleRejectManager);

// Employee management routes
router.get('/employees', handleGetAllEmployees);

// System statistics
router.get('/stats', handleGetSystemStats);

module.exports = router;
