const express = require('express');
const router = express.Router();
const { getProjectParticipants } = require('../../controller/videoCallController/videoCallController');
const { checkForAuthenticationCookie } = require('../../middleware/authMiddleware');

// Get all participants for a project video call
router.get('/project/:projectId/participants', checkForAuthenticationCookie('token'), getProjectParticipants);

module.exports = router;
