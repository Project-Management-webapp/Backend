const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  User  = require('../../model/userModel/user');
const { sendForgetPasswordEmail } = require('../../emailService/authEmail');

const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendForgetPasswordEmail(user.email, resetUrl);

    res.json({ success: true, message: "Password reset email sent", resetUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

const handleResetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!resetToken)
      return res
        .status(400)
        .json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};




module.exports = {
handleForgotPassword,
handleResetPassword,
};