const express = require('express');
const {
  handleGetMyNotifications,
  handleDeleteNotification,

} = require('../../controller/notificationController/notificationController');

const router = express.Router();


// Notification operations
router.get('/', handleGetMyNotifications);
router.delete('/:notificationId', handleDeleteNotification);

module.exports = router;
