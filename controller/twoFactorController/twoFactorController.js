const User = require('../../model/userModel/user');
const twoFactorService = require('../../services/twoFactorService');
const otpStore = require('../../services/otpStore');
const { send2FAEmail } = require('../../emailService/twoFactorEmail');

/**
 * Send OTP to user's email
 */
const sendOTP = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID and email are required'
      });
    }

    // Verify user exists
    const user = await User.findOne({
      where: { id: userId, email: email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate OTP
    const { otp, expiryTime, hashedOTP } = twoFactorService.createOTP();

    // Store OTP in memory
    otpStore.set(userId, {
      hashedOTP,
      expiryTime,
      attempts: 0
    });

    // Send OTP via email
    await send2FAEmail(email, user.fullName, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: 300 // 5 minutes in seconds
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }

    // Get stored OTP data
    const otpData = otpStore.get(userId);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.'
      });
    }

    // Check attempts (max 3 attempts)
    if (otpData.attempts >= 3) {
      otpStore.delete(userId);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    const verification = twoFactorService.verifyOTP(
      otp,
      otpData.hashedOTP,
      otpData.expiryTime
    );

    if (!verification.valid) {
      // Increment attempts
      otpData.attempts += 1;
      otpStore.set(userId, otpData);

      return res.status(400).json({
        success: false,
        message: verification.message,
        attemptsLeft: 3 - otpData.attempts
      });
    }

    // OTP verified successfully - delete from store
    otpStore.delete(userId);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
};

/**
 * Enable 2FA for user
 */
const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // Enable 2FA
    await user.update({
      twoFactorEnabled: true
    });

    res.status(200).json({
      success: true,
      message: '2FA has been enabled successfully'
    });

  } catch (error) {
    console.error('Error enabling 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA. Please try again.'
    });
  }
};

/**
 * Disable 2FA for user
 */
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already disabled'
      });
    }

    // Disable 2FA
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    res.status(200).json({
      success: true,
      message: '2FA has been disabled successfully'
    });

  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA. Please try again.'
    });
  }
};

/**
 * Get 2FA status
 */
const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'twoFactorEnabled']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled
    });

  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  enable2FA,
  disable2FA,
  get2FAStatus
};
