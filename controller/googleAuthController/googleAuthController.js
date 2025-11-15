const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../../model/userModel/user');


const setupGoogleAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.googleAuthEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator is already enabled'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Project Management (${user.email})`,
      issuer: 'Project Management System',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Temporarily store secret (not enabled yet - user needs to verify first)
    await user.update({
      googleAuthSecret: secret.base32
    });

    res.status(200).json({
      success: true,
      message: 'Google Authenticator setup initiated',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });

  } catch (error) {
    console.error('Error setting up Google Authenticator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup Google Authenticator'
    });
  }
};


const verifyAndEnableGoogleAuth = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.googleAuthSecret) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator not setup. Please setup first.'
      });
    }

    if (user.googleAuthEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator is already enabled'
      });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.googleAuthSecret,
      encoding: 'base32',
      token: token,
      window: 0 // Strict validation - only current 60-second window
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

    // Enable Google Authenticator
    await user.update({
      googleAuthEnabled: true
    });

    res.status(200).json({
      success: true,
      message: 'Google Authenticator enabled successfully'
    });

  } catch (error) {
    console.error('Error verifying Google Authenticator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Google Authenticator'
    });
  }
};

/**
 * Verify Google Authenticator code (for login)
 */
const verifyGoogleAuthCode = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID and token are required'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.googleAuthEnabled || !user.googleAuthSecret) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator is not enabled'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.googleAuthSecret,
      encoding: 'base32',
      token: token,
      window: 0
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid authentication code'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Code verified successfully'
    });

  } catch (error) {
    console.error('Error verifying Google Authenticator code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
};


const disableGoogleAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.googleAuthEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Google Authenticator is already disabled'
      });
    }

    // Disable Google Authenticator
    await user.update({
      googleAuthEnabled: false,
      googleAuthSecret: null
    });

    res.status(200).json({
      success: true,
      message: 'Google Authenticator disabled successfully'
    });

  } catch (error) {
    console.error('Error disabling Google Authenticator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable Google Authenticator'
    });
  }
};


const getGoogleAuthStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'googleAuthEnabled']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      googleAuthEnabled: user.googleAuthEnabled
    });

  } catch (error) {
    console.error('Error getting Google Authenticator status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status'
    });
  }
};

module.exports = {
  setupGoogleAuth,
  verifyAndEnableGoogleAuth,
  verifyGoogleAuthCode,
  disableGoogleAuth,
  getGoogleAuthStatus
};
