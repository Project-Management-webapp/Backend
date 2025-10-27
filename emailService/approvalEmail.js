const { transporter } = require("../config/nodemailerConfig/nodemailer");

const sendLoginGuideToEmployee = async (employeeEmail, role) => {
  try {
    const mailOptions = {
      from: `"MANNA Project Management" <${process.env.ADMIN_EMAIL}>`,
      to: employeeEmail,
      subject: "Welcome to MANNA Project Management - Login Instructions",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #1a39ff;">Welcome to MANNA Project Management</h2>
    <p>Hello,</p>
    <p>You have been successfully added as an <strong>${role}</strong> in the <strong>MANNA Project Management System</strong> by the admin.</p>
    <p>Your registered email is: <strong>${employeeEmail}</strong></p>

    <h3 style="color: #333; margin-top: 20px;">Next Steps:</h3>
    <ol style="color: #555; line-height: 1.6;">
      <li>Go to the <a href="https://your-login-page-link.com" style="color: #1a39ff;">Login Page</a>.</li>
      <li>Select <strong>"Forgot Password"</strong> to reset your password using this registered email.</li>
      <li>Once reset, login to your account with the new password.</li>
      <li>Go to your <strong>Profile</strong> section and update your personal details.</li>
    </ol>

    <p style="margin-top: 20px;">If you face any issues, please contact your admin for assistance.</p>

    <p style="margin-top: 25px;">Thanks,<br/>The MANNA Project Management Team</p>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Login guide email sent to employee:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending login guide email:", error);
    return false;
  }
};

module.exports = {
  sendLoginGuideToEmployee,
};
