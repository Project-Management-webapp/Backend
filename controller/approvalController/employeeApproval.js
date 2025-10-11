const { sendApprovalConfirmationEmail, sendRejectionNotificationEmail } = require("../../emailService/approvalEmail");
const User = require("../../model/userModel/user");


const handleGetPendingApprovals = async (req, res) => {
  try {
    const pendingEmployees = await User.findAll({
      where: {
        isApproved: false,
        role: ['employee']
      },
    });

    res.status(200).json({
      success: true,
      message: "Pending approvals retrieved successfully",
      data: {
        pendingApprovals: pendingEmployees,
        totalPending: pendingEmployees.length
      }
    });

  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleApproveEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({
      where: {
        id: employeeId,
        isApproved: false,
        role: ['employee']
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or already approved"
      });
    }

    await employee.update({
      isApproved: true,
      status: 'active'
    });

      await sendApprovalConfirmationEmail(
        employee.email, 
      );
 
    res.status(200).json({
      success: true,
      message: "Employee approved successfully",
      data: {
        employee
      }
    });

  } catch (error) {
    console.error("Approve employee error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleRejectEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({
      where: {
        id: employeeId,
        isApproved: false,
        role: ['employee']
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or already processed"
      });
    }

    await employee.update({
      isApproved: false,
      status: 'inactive'
    });

      await sendRejectionNotificationEmail(
        employee.email, 
      );

    res.status(200).json({
      success: true,
      message: "Employee rejected successfully",
      data: {
        employee
      }
    });

  } catch (error) {
    console.error("Reject employee error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


module.exports = {
  handleGetPendingApprovals,
  handleApproveEmployee,
  handleRejectEmployee,
};
