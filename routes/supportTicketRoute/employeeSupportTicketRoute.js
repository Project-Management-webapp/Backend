const express = require('express');
const router = express.Router();
const {
  handleCreateTicket,
  handleGetMyTickets,
  handleGetTicketById,
  handleAddResponse,
} = require('../../controller/supportTicketController/supportTicketController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');
const upload = require('../../cloudinaryServices/upload');

// Employee routes for support tickets
router.post('/', upload.array('attachments', 5), authorizeRoles(['employee']), handleCreateTicket);
router.get('/my-tickets', authorizeRoles(['employee']), handleGetMyTickets);
router.get('/:id', authorizeRoles(['employee']), handleGetTicketById);
router.post('/:id/response', upload.array('attachments', 5), authorizeRoles(['employee']), handleAddResponse);

module.exports = router;
