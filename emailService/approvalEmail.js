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

const sendManagerApprovalEmail = async (managerEmail, managerName, isApproved, rejectionReason = '') => {
  try {
    const subject = isApproved 
      ? "Manager Account Approved - MANNA Project Management"
      : "Manager Account Status - MANNA Project Management";

    const approvedContent = `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #10b981; margin: 0;">✓ Account Approved!</h2>
    </div>
    
    <p>Hello ${managerName},</p>
    
    <p>Great news! Your manager account has been <strong style="color: #10b981;">approved</strong> by the administrator.</p>
    
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>You can now access your dashboard and start managing projects!</strong>
      </p>
    </div>

    <h3 style="color: #333; margin-top: 25px;">Next Steps:</h3>
    <ol style="color: #555; line-height: 1.8;">
      <li>Visit the <a href="${process.env.FRONTEND_URL || 'https://your-app-url.com'}/login" style="color: #1a39ff; text-decoration: none;">Login Page</a></li>
      <li>Sign in with your registered email: <strong>${managerEmail}</strong></li>
      <li>Complete your profile in the Profile section</li>
      <li>Start creating projects and managing your team</li>
    </ol>

    <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong>Need Help?</strong><br/>
        If you have any questions, please contact the administrator or refer to our documentation.
      </p>
    </div>

    <p style="margin-top: 25px; color: #666;">Best regards,<br/>
    <strong>MANNA Project Management Team</strong></p>
  </div>
</div>
    `;

    const rejectedContent = `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #ef4444; margin: 0;">Account Status Update</h2>
    </div>
    
    <p>Hello ${managerName},</p>
    
    <p>Thank you for your interest in joining MANNA Project Management as a manager.</p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b;">
        <strong>Unfortunately, your manager account registration has not been approved at this time.</strong>
      </p>
    </div>

    ${rejectionReason ? `
    <div style="margin: 20px 0;">
      <h4 style="color: #333; margin-bottom: 10px;">Reason:</h4>
      <p style="color: #555; background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 0;">
        ${rejectionReason}
      </p>
    </div>
    ` : ''}

    <p style="margin-top: 20px; color: #666;">
      If you believe this was a mistake or would like to discuss this decision, please contact the administrator.
    </p>

    <p style="margin-top: 25px; color: #666;">Best regards,<br/>
    <strong>MANNA Project Management Team</strong></p>
  </div>
</div>
    `;

    const mailOptions = {
      from: `"MANNA Project Management" <${process.env.ADMIN_EMAIL}>`,
      to: managerEmail,
      subject: subject,
      html: isApproved ? approvedContent : rejectedContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Manager ${isApproved ? 'approval' : 'rejection'} email sent:`, info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending manager approval email:", error);
    return false;
  }
};

module.exports = {
  sendLoginGuideToEmployee,
  sendManagerApprovalEmail,
};
