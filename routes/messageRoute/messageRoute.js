const express = require('express');
const {
  handleSendMessage,
  handleGetProjectMessages,
  handleUpdateMessage,
  handleDeleteMessage
} = require('../../controller/messageController/messageController');


const router = express.Router();


router.post('/', handleSendMessage);
router.get('/project/:projectId', handleGetProjectMessages);
router.put('/:messageId', handleUpdateMessage);
router.delete('/:messageId', handleDeleteMessage);

module.exports = router;
