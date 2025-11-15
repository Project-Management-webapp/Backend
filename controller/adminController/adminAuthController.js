const bcrypt = require("bcrypt");
const User = require("../../model/userModel/user");
const { createToken } = require("../../services/authServices");
const { setTokenCookie, clearTokenCookie } = require("../../services/cookieServices");

// Admin Signup - Should be used only for initial admin creation or by existing admin
const handleAdminSignUp = async (req, res) => {
  try {
    const { email, password, fullName, adminSecret } = req.body;

    // Check if admin with this email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      fullName: fullName || null,
      role: "admin",
      employeeId: 'A' + Math.floor(1000 + Math.random() * 9000).toString(),
      approvalStatus: 'approved',
      isActive: true,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          fullName: newAdmin.fullName,
          role: newAdmin.role,
          employeeId: newAdmin.employeeId
        },
      },
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Admin Login
const handleAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      where: {
        email,
        role: "admin",
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (user.status !== 'active' || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();
        return res.status(423).json({
          success: false,
          message: "Too many failed login attempts. Account locked for 30 minutes.",
        });
      }
      
      await user.save();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.accountLockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Check if 2FA is enabled (email OTP or Google Authenticator)
    const twoFactorEnabled = user.twoFactorEnabled || user.googleAuthEnabled;
    
    if (twoFactorEnabled) {
      // Determine which 2FA method is enabled
      let twoFactorMethod = null;
      if (user.googleAuthEnabled) {
        twoFactorMethod = 'google_authenticator';
      } else if (user.twoFactorEnabled) {
        twoFactorMethod = 'email_otp';
      }

      return res.status(200).json({
        success: true,
        message: "Password verified. Please complete 2FA verification.",
        requiresTwoFactor: true,
        twoFactorMethod: twoFactorMethod,
        userId: user.id,
        email: user.email
      });
    }

    // Create JWT token
    const token = createToken(user);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          employeeId: user.employeeId,
          profileImage: user.profileImage,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Admin Logout
const handleAdminLogout = async (req, res) => {
  try {
    clearTokenCookie(res);
    res.status(200).json({
      success: true,
      message: "Admin logout successful",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const handleGetProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findOne({
      where: {
        id: userId,
        role: ["admin"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


module.exports = {
  handleAdminSignUp,
  handleAdminLogin,
  handleAdminLogout,
  handleGetProfile
};
