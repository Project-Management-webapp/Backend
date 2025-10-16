const express = require('express');
const {
  handleCreatePayment,
  handleGetAllPayments,
  handleUpdatePayment,
  handleDeletePayment,
  handleApprovePaymentRequest,
  handleRejectPaymentRequest,
} = require('../../controller/paymentController/paymentController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authorizeRoles(['manager']), handleCreatePayment);
router.get('/', authorizeRoles(['manager']), handleGetAllPayments);
router.put('/:paymentId', authorizeRoles(['manager']), handleUpdatePayment);
router.delete('/:paymentId', authorizeRoles(['manager']), handleDeletePayment);

// Payment workflow - Manager actions
router.post('/:id/approve', authorizeRoles(['manager']), handleApprovePaymentRequest);
router.post('/:id/reject', authorizeRoles(['manager']), handleRejectPaymentRequest);

module.exports = router;
