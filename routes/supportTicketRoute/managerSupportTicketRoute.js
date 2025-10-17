const express = require('express');
const router = express.Router();
const {
  handleGetAllTickets,
  handleGetTicketById,
  handleAddResponse,
  handleUpdateTicket,
} = require('../../controller/supportTicketController/supportTicketController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');
const upload = require('../../cloudinaryServices/upload');

// Manager/Admin routes for support ticket management
router.get('/all', authorizeRoles(['manager']), handleGetAllTickets);
router.get('/:id', authorizeRoles(['manager']), handleGetTicketById);
router.post('/:id/response', upload.array('attachments', 5), authorizeRoles(['manager']), handleAddResponse);
router.put('/:id', authorizeRoles(['manager']), handleUpdateTicket);

module.exports = router;
