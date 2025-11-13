const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  enable2FA,
  disable2FA,
  get2FAStatus
} = require('../../controller/twoFactorController/twoFactorController');
const { completeLogin } = require('../../controller/authController/authController');
const { checkForAuthenticationCookie } = require('../../middleware/authMiddleware');

// Public routes (no auth required - for login flow)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/complete-login', completeLogin);

// Protected routes (auth required - for profile settings)
router.get('/status', checkForAuthenticationCookie('token'), get2FAStatus);
router.post('/enable', checkForAuthenticationCookie('token'), enable2FA);
router.post('/disable', checkForAuthenticationCookie('token'), disable2FA);

module.exports = router;
