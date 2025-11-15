const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const User  = require("../../model/userModel/user");
const { createToken } = require("../../services/authServices");

const { setTokenCookie, clearTokenCookie } = require("../../services/cookieServices");

const handleManagerSignUp = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      fullName: fullName || null,
      role: "manager",
      managerId: 'M' + Math.floor(1000 + Math.random() * 9000).toString(),
      approvalStatus: 'pending',
      isActive: false // Will be activated after admin approval
    });

    res.status(201).json({
      success: true,
      message: "Manager registration submitted successfully. Please wait for admin approval.",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          approvalStatus: newUser.approvalStatus
        },
      },
    });
  } catch (error) {
    console.error("Manager signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleManagerLogin = async (req, res) => {
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
        role: "manager",
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check approval status
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval by the administrator. Please wait for approval.",
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: "Your account registration has been rejected. Please contact the administrator.",
      });
    }

    // Check if account is active
    if (user.status !== 'active' || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Please contact the administrator.",
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
      const loginAttempts = user.loginAttempts + 1;
      const updateData = { loginAttempts };

      // Lock account after 5 failed attempts
      if (loginAttempts >= 100) {
        updateData.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); 
      }

      await user.update(updateData);

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        attemptsRemaining: Math.max(0, 5 - loginAttempts),
      });
    }

    // Check if Email OTP 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return success but indicate Email 2FA is required
      return res.status(200).json({
        success: true,
        require2FA: true,
        twoFactorMethod: 'email',
        message: "2FA verification required",
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName
        }
      });
    }

    // Check if Google Authenticator is enabled
    if (user.googleAuthEnabled) {
      // Return success but indicate Google Auth is required
      return res.status(200).json({
        success: true,
        require2FA: true,
        twoFactorMethod: 'google',
        message: "Google Authenticator verification required",
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName
        }
      });
    }

    // Reset login attempts on successful login
    await user.update({
      loginAttempts: 0,
      accountLockedUntil: null,
      lastLogin: new Date(),
    });


    const token = createToken(user);
    setTokenCookie(res, token);


    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Manager login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleManagerLogout = async (req, res) => {
  try {
    clearTokenCookie(res);  
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Manager logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
}
};

const handleManagerGetProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findOne({
      where: {
        id: userId,
        role: "manager",
      },
      
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Manager profile not found",
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

const handleManagerUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const {
      fullName,
      alternateEmail,
      
      // Role and Position Information
      position,
      department,
      jobTitle,
      level,

      
      // Contact Information
      phone,
      alternatePhone,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      
      // Address Information
      address,
      city,
      state,
      country,
      zipCode,
      
      // Personal Information
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      
      // Professional Information
      joiningDate,
      contractType,
      workLocation,
      workSchedule,
      probationEndDate,
      confirmationDate,
      
      // Financial Information (managers might update their own info)
      baseSalary,
      currency,
      payrollId,
      bankAccountNumber,
      bankName,
      bankRoutingNumber,
      taxId,
      socialSecurityNumber,
      
      // Skills and Education
      skills,
      education,
      certifications,
      languages,
      
      // Performance and Rating
      performanceRating,
      lastReviewDate,
      nextReviewDate,
    
      
      // Leave and Time Off
      totalLeaveBalance,
      usedLeaveBalance,
      sickLeaveBalance,
      
      // Additional Information
      bio,
      notes,
      preferences,
      timezone,
    } = req.body;
     const profileImage = req.file ? req.file.path : undefined;

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }


    const updateData = {};
    
   
    if (fullName !== undefined) updateData.fullName = fullName;
    if (alternateEmail !== undefined) updateData.alternateEmail = alternateEmail;
    
    // Role and Position Information
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (level !== undefined) updateData.level = level;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    
    // Contact Information
    if (phone !== undefined) updateData.phone = phone;
    if (alternatePhone !== undefined) updateData.alternatePhone = alternatePhone;
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone;
    if (emergencyContactRelation !== undefined) updateData.emergencyContactRelation = emergencyContactRelation;
    
    // Address Information
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    
    // Personal Information
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    
    // Professional Information
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (contractType !== undefined) updateData.contractType = contractType;
    if (workLocation !== undefined) updateData.workLocation = workLocation;
    if (workSchedule !== undefined) updateData.workSchedule = workSchedule;
    if (probationEndDate !== undefined) updateData.probationEndDate = probationEndDate;
    if (confirmationDate !== undefined) updateData.confirmationDate = confirmationDate;
    
    // Financial Information
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
    if (currency !== undefined) updateData.currency = currency;
    if (payrollId !== undefined) updateData.payrollId = payrollId;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankRoutingNumber !== undefined) updateData.bankRoutingNumber = bankRoutingNumber;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (socialSecurityNumber !== undefined) updateData.socialSecurityNumber = socialSecurityNumber;
    
    // Skills and Education
    if (skills !== undefined) updateData.skills = skills;
    if (education !== undefined) updateData.education = education;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (languages !== undefined) updateData.languages = languages;
    
    // Performance and Rating
    if (performanceRating !== undefined) updateData.performanceRating = performanceRating;
    if (lastReviewDate !== undefined) updateData.lastReviewDate = lastReviewDate;
    if (nextReviewDate !== undefined) updateData.nextReviewDate = nextReviewDate;
    
 
    
    // Leave and Time Off
    if (totalLeaveBalance !== undefined) updateData.totalLeaveBalance = totalLeaveBalance;
    if (usedLeaveBalance !== undefined) updateData.usedLeaveBalance = usedLeaveBalance;
    if (sickLeaveBalance !== undefined) updateData.sickLeaveBalance = sickLeaveBalance;
    
    // Additional Information
    if (bio !== undefined) updateData.bio = bio;
    if (notes !== undefined) updateData.notes = notes;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (timezone !== undefined) updateData.timezone = timezone;


    await user.update(updateData);

    const updatedUser = await User.findOne({
      where: { id: userId },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
      updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



module.exports = {
  handleManagerSignUp,
  handleManagerLogin,
  handleManagerLogout,
  handleManagerGetProfile,
  handleManagerUpdateProfile,
};
