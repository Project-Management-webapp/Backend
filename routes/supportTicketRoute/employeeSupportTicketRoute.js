const express = require('express');
const router = express.Router();
const {
  handleCreateTicket,
  handleGetMyTickets,
  handleGetTicketById,
} = require('../../controller/supportTicketController/supportTicketController');
const { authorizeRoles } = require('../../middleware/roleMiddleware');
const upload = require('../../cloudinaryServices/upload');


router.post('/create', upload.array('attachments', 5), authorizeRoles(['employee']), handleCreateTicket);
router.get('/my-tickets', authorizeRoles(['employee']), handleGetMyTickets);
router.get('/:id', authorizeRoles(['employee']), handleGetTicketById);


module.exports = router;
