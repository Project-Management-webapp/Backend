const express = require('express');
const router = express.Router();
const {
  handleCreateTicket,
  handleGetMyTickets,
  handleGetTicketById,
  handleAddResponse,
  handleUpdateTicket,
  handleReopenTicket,
} = require('../../controller/supportTicketController/supportTicketController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

router.post('/', authorizeRoles(['employee']), handleCreateTicket);
router.get('/my-tickets', authorizeRoles(['employee']), handleGetMyTickets);
router.get('/:id', authorizeRoles(['employee']), handleGetTicketById);
router.post('/:id/response', authorizeRoles(['employee']), handleAddResponse);
router.put('/:id', authorizeRoles(['employee']), handleUpdateTicket);
router.post('/:id/reopen', authorizeRoles(['employee']), handleReopenTicket);

module.exports = router;
