const { transporter } = require("../../config/nodemailerConfig/nodemailer");

const sendContactToAdmin = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide either email or phone number",
      });
    }

    // Get admin email from environment variable
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      return res.status(500).json({
        success: false,
        message: "Admin email not configured",
      });
    }

    // Prepare email content
    let contactInfo = "";
    if (email) {
      contactInfo += `Email: ${email}\n`;
    }
    if (phone) {
      contactInfo += `Phone: ${phone}\n`;
    }

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: adminEmail,
      subject: "New Contact Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Request</h2>
          <p>You have received a new contact request with the following details:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          </div>
          <p style="color: #666; font-size: 12px;">
            Received at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    };

    // Send email to admin
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Contact information sent successfully",
    });
  } catch (error) {
    console.error("Error sending contact information:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send contact information",
      error: error.message,
    });
  }
};

module.exports = {
  sendContactToAdmin,
};
