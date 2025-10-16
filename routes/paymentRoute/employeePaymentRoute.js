const express = require('express');
const {
  handleGetMyPayments,
  handleGetPaymentById,
  handleRequestPayment,
  handleConfirmPaymentReceived,
} = require('../../controller/paymentController/paymentController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/my-payments', authorizeRoles(['employee']), handleGetMyPayments);
router.get('/:paymentId', authorizeRoles(['employee']), handleGetPaymentById);

// Payment workflow - Employee actions
router.post('/request', authorizeRoles(['employee']), handleRequestPayment);
router.post('/:id/confirm', authorizeRoles(['employee']), handleConfirmPaymentReceived);

module.exports = router;
