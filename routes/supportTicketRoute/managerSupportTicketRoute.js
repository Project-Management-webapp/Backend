const express = require('express');
const router = express.Router();
const {
  handleGetAllTickets,
  handleGetTicketById,
  handleAssignTicket,
  handleAddResponse,
  handleUpdateTicket,
  handleCloseTicket,
} = require('../../controller/supportTicketController/supportTicketController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');

// Manager/Admin routes for support ticket management
router.get('/all', authorizeRoles(['manager']), handleGetAllTickets);
router.get('/:id', authorizeRoles(['manager']), handleGetTicketById);
router.post('/:id/assign', authorizeRoles(['manager']), handleAssignTicket);
router.post('/:id/response', authorizeRoles(['manager']), handleAddResponse);
router.put('/:id', authorizeRoles(['manager']), handleUpdateTicket);
router.post('/:id/close', authorizeRoles(['manager']), handleCloseTicket);

module.exports = router;
