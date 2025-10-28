const { transporter } = require("../config/nodemailerConfig/nodemailer");

/**
 * Send milestone reminder email to employee or manager
 */
const sendMilestoneReminderEmail = async (
  toEmail, 
  recipientName, 
  projectName, 
  milestoneName, 
  milestoneDescription, 
  milestoneDeadline,
  isToday = false,
  isManager = false,
  assignedEmployeesCount = 0
) => {
  try {
    const urgencyText = isToday ? 'TODAY' : 'TOMORROW';
    const urgencyColor = isToday ? '#dc2626' : '#ea580c';
    const urgencyEmoji = isToday ? '⚠️' : '📅';
    
    const roleSpecificText = isManager 
      ? `<p style="margin: 10px 0; color: #666;">You have <strong>${assignedEmployeesCount}</strong> employee(s) assigned to this project. Please ensure they are on track to meet this milestone.</p>`
      : `<p style="margin: 10px 0; color: #666;">Please ensure you're on track to complete this milestone on time.</p>`;

    const mailOptions = {
      from: `"Project Management Service" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: `${urgencyEmoji} Milestone Due ${urgencyText}: ${milestoneName} - ${projectName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4733fc 0%, #1a39ff 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
        ${urgencyEmoji} Milestone Reminder
      </h1>
    </div>

    <!-- Alert Banner -->
    <div style="background-color: ${urgencyColor}; padding: 15px; text-align: center;">
      <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
        Due ${urgencyText}: ${milestoneDeadline}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
        Hello <strong>${recipientName}</strong>,
      </p>

      <p style="font-size: 15px; color: #666; margin: 0 0 20px 0; line-height: 1.6;">
        This is a reminder that the following milestone is due <strong style="color: ${urgencyColor};">${urgencyText}</strong>:
      </p>

      <!-- Milestone Card -->
      <div style="background-color: #f8fafc; border-left: 4px solid #4733fc; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <h2 style="color: #1a39ff; margin: 0 0 10px 0; font-size: 18px;">
          📌 ${milestoneName}
        </h2>
        <p style="color: #333; margin: 0 0 10px 0; font-size: 14px;">
          <strong>Project:</strong> ${projectName}
        </p>
        ${milestoneDescription ? `
        <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
          <strong>Description:</strong> ${milestoneDescription}
        </p>
        ` : ''}
        <p style="color: ${urgencyColor}; margin: 0; font-size: 14px; font-weight: 600;">
          <strong>Deadline:</strong> ${milestoneDeadline}
        </p>
      </div>

      ${roleSpecificText}

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>💡 Tip:</strong> ${isToday 
            ? 'Focus on completing this milestone today to stay on schedule!' 
            : 'Plan your work for tomorrow to ensure timely completion of this milestone.'}
        </p>
      </div>

      ${isManager ? `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/manager/projects" 
           style="display: inline-block; background-color: #4733fc; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Project Dashboard
        </a>
      </div>
      ` : `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employee/projects" 
           style="display: inline-block; background-color: #4733fc; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
          View Your Projects
        </a>
      </div>
      `}

      <p style="font-size: 14px; color: #666; margin: 20px 0 0 0; line-height: 1.6;">
        If you have any questions or need assistance, please don't hesitate to reach out.
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Best regards,<br/>
        <strong style="color: #1a39ff;">Project Management Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This is an automated reminder from the Project Management System.<br/>
        You received this email because you are ${isManager ? 'managing' : 'assigned to'} this project.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} Project Management Service. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Milestone reminder email sent to ${toEmail}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ Error sending milestone reminder email to ${toEmail}:`, error);
    return false;
  }
};

module.exports = {
  sendMilestoneReminderEmail,
};
