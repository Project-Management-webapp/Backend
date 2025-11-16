const { transporter } = require('../config/nodemailerConfig/nodemailer');

async function send2FAEmail(email, fullName, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: ' Two-Factor Authentication Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-top: 20px;
          }
          .header {
            text-align: center;
            color: black;
            margin-bottom: 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: black;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 14px;
          }
          .info-box {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Two-Factor Authentication</h1>
          </div>
          
          <div class="content">
            <p>Hello <strong>${email}</strong>,</p>
            
            <p>You are attempting to log in to your account. Please use the verification code below to complete your login:</p>
            
            <div class="otp-box">
              ${otp}
            </div>
            
            <div class="info-box">
              <strong>⏱️ Valid for 5 minutes</strong>
              <p style="margin: 5px 0 0 0;">This code will expire in 5 minutes. If it expires, you'll need to request a new code.</p>
            </div>
            
            <div class="warning">
              <strong> Security Notice</strong>
              <p style="margin: 5px 0 0 0;">If you didn't attempt to log in, please ignore this email and ensure your account password is secure. Never share this code with anyone.</p>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Project Management Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Project Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending 2FA email:', error);
    throw error;
  }
}

module.exports = { send2FAEmail };
