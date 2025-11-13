const User = require('../../model/userModel/user');
const { createToken } = require('../../services/authServices');
const { setTokenCookie } = require('../../services/cookieServices');

/**
 * Complete login after successful 2FA verification
 */
const completeLogin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findOne({
      where: {
        id: userId,
        status: 'active'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update login information
    await user.update({
      loginAttempts: 0,
      accountLockedUntil: null,
      lastLogin: new Date(),
    });

    // Generate token and set cookie
    const token = createToken(user);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });

  } catch (error) {
    console.error('Error completing login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete login. Please try again.'
    });
  }
};

module.exports = { completeLogin };
