const express = require('express');
const router = express.Router();
const {
  setupGoogleAuth,
  verifyAndEnableGoogleAuth,
  verifyGoogleAuthCode,
  disableGoogleAuth,
  getGoogleAuthStatus
} = require('../../controller/googleAuthController/googleAuthController');
const { checkForAuthenticationCookie } = require('../../middleware/authMiddleware');

// Public routes (no auth required - for login flow)
router.post('/verify-code', verifyGoogleAuthCode);

// Protected routes (auth required - for profile settings)
router.get('/status', checkForAuthenticationCookie('token'), getGoogleAuthStatus);
router.post('/setup', checkForAuthenticationCookie('token'), setupGoogleAuth);
router.post('/verify-and-enable', checkForAuthenticationCookie('token'), verifyAndEnableGoogleAuth);
router.post('/disable', checkForAuthenticationCookie('token'), disableGoogleAuth);

module.exports = router;
