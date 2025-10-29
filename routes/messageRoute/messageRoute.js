const express = require('express');
const {
  handleSendMessage,
  handleGetProjectMessages,
  handleUpdateMessage,
  handleDeleteMessage,
  handleReplyToMessage,
  handleGetProjectsWithMentions,
  handleMarkMentionsAsViewed
} = require('../../controller/messageController/messageController');
const upload = require('../../cloudinaryServices/upload');

const router = express.Router();

// Send message with optional file attachments (up to 5 files)
router.post('/send', upload.array('attachments', 5), handleSendMessage);
router.get('/project/:projectId', handleGetProjectMessages);
router.put('/:messageId', handleUpdateMessage);
router.delete('/:messageId', handleDeleteMessage);
router.post('/:messageId/reply', upload.array('attachments', 5), handleReplyToMessage);
router.get('/mentions/projects', handleGetProjectsWithMentions);
router.post('/mentions/viewed/:projectId', handleMarkMentionsAsViewed);

module.exports = router;
