const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const User  = require("../../model/userModel/user");
const { createToken } = require("../../services/authServices");
const { setTokenCookie, clearTokenCookie } = require("../../services/cookieServices");
const { sendLoginGuideToEmployee } = require("../../emailService/approvalEmail");


const handleEmployeeSignUp = async (req, res) => {
  try {
    const { email, password } = req.body;

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
      role: "employee",
      employeeId: 'E' + Math.floor(1000 + Math.random() * 9000).toString()
    });

    await sendLoginGuideToEmployee(newUser.email, newUser.role);
    
    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error("Employee signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleEmployeeLogin = async (req, res) => {
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
        role: ["employee"],
        status: "active",
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
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

      // Lock account after 100 failed attempts in dev will kept 100
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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Return success but indicate 2FA is required
      return res.status(200).json({
        success: true,
        require2FA: true,
        message: "2FA verification required",
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
    console.error("Employee login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleEmployeeLogout = async (req, res) => {
  try {
    clearTokenCookie(res);  
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Employee logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const handleEmployeeGetProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findOne({
      where: {
        id: userId,
        role: ["employee"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
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

const handleEmployeeUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      alternateEmail,
      
      // Role and Position Information (employees can update some of these)
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
      
      // Professional Information (limited for employees)
      workLocation,
      workSchedule,
      
      // Financial Information (limited access for employees)
      bankAccountNumber,
      bankName,
      bankRoutingNumber,
      
      // Skills and Education
      skills,
      education,
      certifications,
      languages,
      
      // Additional Information
      bio,
      notes,
      preferences,
      timezone,
      rate
    } = req.body;
    const profileImage = req.file ? req.file.path : undefined;

    const user = await User.findOne({
      where: {
        id: userId,
        role: ["employee"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    const updateData = {};
    
    // Only add fields to updateData if they are provided in the request
    if (fullName !== undefined) updateData.fullName = fullName;
    if (alternateEmail !== undefined) updateData.alternateEmail = alternateEmail;
    
    // Role and Position Information (limited for employees)
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
    
    // Professional Information (limited for employees)
    if (workLocation !== undefined) updateData.workLocation = workLocation;
    if (workSchedule !== undefined) updateData.workSchedule = workSchedule;
    
    // Financial Information (limited access for employees - only banking details)
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankRoutingNumber !== undefined) updateData.bankRoutingNumber = bankRoutingNumber;
    
    // Skills and Education
    if (skills !== undefined) updateData.skills = skills;
    if (education !== undefined) updateData.education = education;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (languages !== undefined) updateData.languages = languages;
 
    
    // Additional Information
    if (bio !== undefined) updateData.bio = bio;
    if (notes !== undefined) updateData.notes = notes;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (rate !== undefined) updateData.rate = rate;

    // Update user with only the provided fields
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
  handleEmployeeSignUp,
  handleEmployeeLogin,
  handleEmployeeLogout,
  handleEmployeeGetProfile,
  handleEmployeeUpdateProfile,
  
};
