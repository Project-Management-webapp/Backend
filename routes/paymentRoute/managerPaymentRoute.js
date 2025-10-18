const express = require('express');
const {
  handleGetAllPayments,
  handleGetPaymentById,
  handleApprovePaymentRequest,
  handleRejectPaymentRequest,
} = require('../../controller/paymentController/paymentController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

// View payments
router.get('/', authorizeRoles(['manager']), handleGetAllPayments);
router.get('/:paymentId', authorizeRoles(['manager']), handleGetPaymentById);

// Payment workflow - Manager actions (approve with transaction proof)
router.post('/:id/approve', authorizeRoles(['manager']), handleApprovePaymentRequest);
router.post('/:id/reject', authorizeRoles(['manager']), handleRejectPaymentRequest);

module.exports = router;

