const { transporter } = require("../config/nodemailerConfig/nodemailer");

const sendApprovalRequestToManager = async (employeeEmail, role) => {
  try {
    const mailOptions = {
      from: `"Project Management Service" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "Approval Mail - Project Management Service",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
  
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">


          <h2 style="color: #1a39ffff;">Hello</h2>
          <p>An Employee recently requested to register on your Project Management Service website.</p>

          <p>Please go to admin dashboard to verify employee credentials and approve <strong>${employeeEmail}</strong></p>
          <strong>${role}</strong></p>
          <p style="margin-top: 20px;">Thanks,<br/>The Project Management Service Team</p>
        </div>
  </div>
</div>


        
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Approval  email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending Approval email:", error);
    return false;
  }
};



const sendApprovalConfirmationEmail = async (employeeEmail) => {
  try {
    const mailOptions = {
      from: `"Project Management Service" <${process.env.ADMIN_EMAIL}>`,
      to: employeeEmail,
      subject: "Account Approved - Welcome to Project Management Service",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
  
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">

          <h2 style="color: #4CAF50;"> Account Approved!</h2>
          <p>Great news! Your account has been approved and you now have access to our Project Management Service.</p>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin: 0 0 10px 0;"> Account Status: APPROVED</h3>
            <p style="margin: 5px 0;"><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Active</p>
          </div>
          
          <p>You can now log in to your account and start using all the features.</p>
          <a href="${process.env.FRONTEND_URL}/employee/login" style="
              display: inline-block;
              padding: 12px 25px;
              margin: 15px 0;
              font-size: 16px;
              color: white;
              background-color: #4CAF50;
              text-decoration: none;
              border-radius: 5px;
          ">Login to Your Account</a>
          
          <p style="margin-top: 20px;">Welcome aboard!<br/>The Project Management Service Team</p>
        </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Approval confirmation email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending approval confirmation email:", error);
    return false;
  }
};

const sendRejectionNotificationEmail = async (employeeEmail) => {
  try {
    const mailOptions = {
      from: `"Project Management Service" <${process.env.ADMIN_EMAIL}>`,
      to: employeeEmail,
      subject: "Account Application Update - Project Management Service",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
  
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">

          <h2 style="color: #f44336;">Application Status Update</h2>
          <p>Thank you for your interest in joining our Project Management Service. After careful review, we regret to inform you that your account application was not approved at this time.</p>
          
          <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #f44336; margin: 0 0 10px 0;"> Application Status: NOT APPROVED</h3>
            <p style="margin: 5px 0;"><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
        
          </div>
          
          <p>If you have any questions about this decision, please contact our support team.</p>
          <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@company.com'}" style="
              display: inline-block;
              padding: 12px 25px;
              margin: 15px 0;
              font-size: 16px;
              color: white;
              background-color: #2196f3;
              text-decoration: none;
              border-radius: 5px;
          ">Contact Support</a>
          
          <p style="margin-top: 20px;">Thanks,<br/>The Project Management Service Team</p>
        </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Rejection notification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending rejection notification email:", error);
    return false;
  }
};

module.exports = {
  sendApprovalRequestToManager,
    sendApprovalConfirmationEmail,
  sendRejectionNotificationEmail,
};