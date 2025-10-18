const Payment = require('../../model/paymentModel/payment');
const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const Notification = require('../../model/notificationModel/notification');
  const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const { Op } = require('sequelize');

// Get all payments with filtering
const handleGetAllPayments = async (req, res) => {
  try {
    const { 
      employeeId, 
      projectId, 
      status,
      paymentType,
      startDate,
      endDate
    } = req.query;

    const whereConditions = {};

    if (employeeId) whereConditions.employeeId = employeeId;
    if (projectId) whereConditions.projectId = projectId;
    if (status) whereConditions.status = status;
    if (paymentType) whereConditions.paymentType = paymentType;
    
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }



    const payments  = await Payment.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position', 'department']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email']
        }
      ],
    
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      data: {
        payments,
        totalPayments: payments.count
      }
    });

  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get payment by ID
const handleGetPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position', 'department', 'bankAccountNumber']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'budget']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Employees can only view their own payments
    if (req.user.role === 'employee' || req.user.role === 'intern') {
      if (payment.employeeId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own payment records"
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully",
      data: payment
    });

  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get employee payments (Employee view)
const handleGetMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, paymentType } = req.query;

    const whereConditions = {
      employeeId: userId
    };

    if (status) whereConditions.status = status;
    if (paymentType) whereConditions.paymentType = paymentType;

    const payments = await Payment.findAll({
      where: whereConditions,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate total earnings
    const totalEarnings = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.status(200).json({
      success: true,
      message: "Your payments retrieved successfully",
      data: {
        payments,
        totalEarnings,
        totalPayments: payments.length
      }
    });

  } catch (error) {
    console.error("Get my payments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



const handleRequestPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assignmentId, requestNotes } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required"
      });
    }

  
    const assignment = await ProjectAssignment.findByPk(assignmentId, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name',  'createdBy', 'budget']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Verify employee is assigned to this project
    if (assignment.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Check if work status is verified
    if (assignment.workStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: `Payment request not allowed. Your work status is '${assignment.workStatus}'. Only verified work can request payment.`,
        currentStatus: assignment.workStatus,
        allowedStatus: 'verified'
      });
    }

    // Check if payment already exists for this assignment
    const existingPayment = await Payment.findOne({
      where: { assignmentId }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Payment already exists with status: ${existingPayment.requestStatus}`
      });
    }

    // Create payment request
    const payment = await Payment.create({
      employeeId: userId,
      projectId: assignment.projectId,
      assignmentId,
      amount: assignment.allocatedAmount,
      currency: assignment.currency || 'USD',
      paymentType: 'project_payment',
      paymentMethod: 'bank_transfer',
      status: 'pending',
      requestStatus: 'requested',
      requestedAt: new Date(),
      requestedBy: userId,
      requestNotes,
      description: `Payment for project: ${assignment.project.name}`,
    });

    // Update employee's pending earnings
    const employee = await User.findByPk(userId);
    employee.pendingEarnings = parseFloat(employee.pendingEarnings || 0) + parseFloat(assignment.allocatedAmount);
    await employee.save();

    // Notify manager/project creator
    await Notification.create({
      userId: assignment.project.createdBy,
      title: 'Payment Request',
      message: `Employee requested payment of ${assignment.allocatedAmount} ${assignment.currency} for project: ${assignment.project.name}`,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
      priority: 'high'
    });

    res.status(201).json({
      success: true,
      message: "Payment requested successfully. Waiting for manager approval.",
      payment
    });

  } catch (error) {
    console.error("Request payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const   handleApprovePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes, transactionId, transactionProofLink } = req.body;
    const userId = req.user.id;

    // Validation: Transaction proof is required
    if (!transactionId && !transactionProofLink) {
      return res.status(400).json({
        success: false,
        message: "Transaction proof is required (provide transactionId or transactionProofLink)"
      });
    }

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.requestStatus !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.requestStatus}. Cannot approve again.`
      });
    }

    // Update payment - approve and mark as paid with transaction proof
    payment.requestStatus = 'paid';
    payment.status = 'completed';
    payment.approvedAt = new Date();
    payment.managerId = userId;
    payment.approvalNotes = approvalNotes;
    payment.transactionId = transactionId;
    payment.transactionProofLink = transactionProofLink;
    await payment.save();

    // Notify employee
    await Notification.create({
      userId: payment.employeeId,
      title: 'Payment Processed',
      message: `Your payment of ${payment.amount} ${payment.currency} for project "${payment.project.name}" has been processed. Please confirm receipt.`,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Payment approved and processed successfully with transaction proof. Waiting for employee confirmation.",
      payment
    });

  } catch (error) {
    console.error("Approve payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reject payment request (Admin/Manager only)
const handleRejectPaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;
    const userId = req.user.id;

    if (!rejectedReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.requestStatus !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.requestStatus}`
      });
    }

    // Update payment
    payment.requestStatus = 'rejected';
    payment.rejectedAt = new Date();
    payment.rejectedBy = userId;
    payment.rejectedReason = rejectedReason;
    payment.status = 'cancelled';
    await payment.save();

    // Update employee's pending earnings
    const employee = await User.findByPk(payment.employeeId);
    employee.pendingEarnings = parseFloat(employee.pendingEarnings || 0) - parseFloat(payment.amount);
    await employee.save();

    // Notify employee
    await Notification.create({
      userId: payment.employeeId,
      title: 'Payment Rejected',
      message: `Your payment request for project ${payment.project.name} was rejected. Reason: ${rejectedReason}`,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Payment request rejected",
      payment
    });

  } catch (error) {
    console.error("Reject payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



// Confirm payment received (Employee only)
const handleConfirmPaymentReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationNotes } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'createdBy']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    if (payment.requestStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: "Payment has not been processed yet"
      });
    }

    if (payment.employeeConfirmation) {
      return res.status(400).json({
        success: false,
        message: "Payment already confirmed"
      });
    }

    // Update payment
    payment.employeeConfirmation = true;
    payment.confirmedAt = new Date();
    payment.confirmationNotes = confirmationNotes;
    payment.requestStatus = 'confirmed';
    await payment.save();

    // Update employee earnings
    const employee = await User.findByPk(userId);
    employee.totalEarnings = parseFloat(employee.totalEarnings || 0) + parseFloat(payment.amount);
    employee.pendingEarnings = parseFloat(employee.pendingEarnings || 0) - parseFloat(payment.amount);
    employee.lastPaymentDate = new Date();
    employee.lastPaymentAmount = payment.amount;

    // Update projectEarnings array
    const projectEarnings = employee.projectEarnings || [];
    projectEarnings.push({
      projectId: payment.projectId,
      projectName: payment.project.name,
      projectCode: payment.project.projectCode,
      amount: payment.amount,
      currency: payment.currency,
      confirmedAt: new Date(),
      paymentId: payment.id
    });
    employee.projectEarnings = projectEarnings;
    await employee.save();

    // Notify manager
    await Notification.create({
      userId: payment.project.createdBy,
      title: 'Payment Confirmed',
      message: `Employee confirmed receipt of payment for project: ${payment.project.name}`,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
    });

    res.status(200).json({
      success: true,
      message: "Payment confirmed successfully. Your earnings have been updated.",
      payment,
      earnings: {
        totalEarnings: employee.totalEarnings,
        pendingEarnings: employee.pendingEarnings
      }
    });

  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



module.exports = {
  handleGetAllPayments,
  handleGetPaymentById,
  handleGetMyPayments,
  handleRequestPayment,
  handleApprovePaymentRequest,
  handleRejectPaymentRequest,
  handleConfirmPaymentReceived,
};
