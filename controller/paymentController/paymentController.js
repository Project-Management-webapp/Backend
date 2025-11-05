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
        },
        {
          model: ProjectAssignment,
          as: 'assignment',
          attributes: ['id', 'allocatedAmount', 'actualAmount', 'actualHours', 'actualConsumables', 'actualMaterials', 'rate']
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
          attributes: ['id', 'fullName', 'email', 'position', 'department']
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
        },
        {
          model: ProjectAssignment,
          as: 'assignment',
          attributes: ['id', 'allocatedAmount', 'actualAmount', 'actualHours', 'actualConsumables', 'actualMaterials', 'rate']
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
        },
        {
          model: ProjectAssignment,
          as: 'assignment',
          attributes: ['id', 'allocatedAmount', 'actualAmount', 'actualHours', 'actualConsumables', 'actualMaterials', 'rate']
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
    const { assignmentId, requestedAmount, requestNotes } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "Assignment ID is required"
      });
    }

    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid requested amount is required"
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
    if (assignment.workStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Payment request not allowed. Your work status is '${assignment.workStatus}'. Only submitted work can request payment.`,
        currentStatus: assignment.workStatus,
        allowedStatus: 'submitted'
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

    // Calculate actual amount from assignment
    const actualHours = parseFloat(assignment.actualHours || 0);
    const rate = parseFloat(assignment.rate || 0);
    const actualConsumables = parseFloat(assignment.actualConsumables || 0);
    const actualMaterials = parseFloat(assignment.actualMaterials || 0);
    const calculatedActualAmount = (actualHours * rate) + actualConsumables + actualMaterials;

    // Create payment request with both allocated and requested amounts
    const payment = await Payment.create({
      employeeId: userId,
      projectId: assignment.projectId,
      assignmentId,
      allocatedAmount: assignment.allocatedAmount, // Store allocated amount for reference
      requestedAmount: requestedAmount, // Amount requested by employee (should be actual amount)
      amount: requestedAmount, // Initial amount (will be updated by manager on approval)
      calculatedActualAmount: calculatedActualAmount, // Store calculated actual amount for reference
      approvedAmount: null, // Will be set by manager on approval
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

    // Update employee's pending earnings (based on requested amount)
    const employee = await User.findByPk(userId);
    employee.pendingEarnings = parseFloat(employee.pendingEarnings || 0) + parseFloat(requestedAmount);
    await employee.save();

    // Notify ALL managers/admins about payment request (visible to all managers)
    await Notification.create({
      userId: assignment.project.createdBy, // Still set creator as primary recipient
      title: 'Payment Request',
      message: `${employee.fullName} requested payment of ${requestedAmount} ${assignment.currency} for project: ${assignment.project.name}`,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
      priority: 'high',
      targetRole: 'all_managers', // Make visible to all managers/admins
      metadata: {
        employeeId: userId,
        employeeName: employee.fullName,
        projectId: assignment.projectId,
        projectName: assignment.project.name,
        allocatedAmount: assignment.allocatedAmount,
        requestedAmount: requestedAmount,
        calculatedActualAmount: calculatedActualAmount
      }
    });

    res.status(201).json({
      success: true,
      message: "Payment requested successfully. Waiting for manager approval.",
      payment: {
        ...payment.toJSON(),
        assignmentDetails: {
          allocatedAmount: assignment.allocatedAmount,
          requestedAmount: requestedAmount,
          calculatedActualAmount: calculatedActualAmount
        }
      }
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

const handleApprovePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes, transactionId, transactionProofLink, actualAmount } = req.body;
    const userId = req.user.id;

    // Validation: Actual amount and transaction proof are required
    if (!actualAmount || actualAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Actual amount is required and must be greater than 0"
      });
    }

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

    // Store the originally requested amount for tracking
    const originalRequestedAmount = payment.requestedAmount || payment.amount;

    // Update ProjectAssignment actualAmount (Manager's final approved amount)
    if (payment.assignmentId) {
      const assignment = await ProjectAssignment.findByPk(payment.assignmentId);
      if (assignment) {
        assignment.actualAmount = actualAmount;
        await assignment.save();
      }
    }

    // Update payment - approve with manager's decided amount
    payment.requestStatus = 'paid';
    payment.status = 'completed';
    payment.approvedAmount = actualAmount; // Amount approved by manager
    payment.amount = actualAmount; // Final payment amount
    payment.approvedAt = new Date();
    payment.managerId = userId;
    payment.approvalNotes = approvalNotes;
    payment.transactionId = transactionId;
    payment.transactionProofLink = transactionProofLink;
    await payment.save();

    // Update employee's earnings based on approved amount
    const employee = await User.findByPk(payment.employeeId);
    if (employee) {
      // Update total earnings with approved amount
      employee.totalEarnings = parseFloat(employee.totalEarnings || 0) + parseFloat(actualAmount);
      
      // Update pending earnings (subtract the originally requested amount, not approved amount)
      employee.pendingEarnings = parseFloat(employee.pendingEarnings || 0) - parseFloat(originalRequestedAmount);
      
      // Ensure pending earnings doesn't go negative
      if (employee.pendingEarnings < 0) {
        employee.pendingEarnings = 0;
      }
      
      // Update project earnings array
      const projectEarnings = employee.projectEarnings || [];
      projectEarnings.push({
        projectId: payment.projectId,
        projectName: payment.project.name,
        amount: parseFloat(actualAmount),
        requestedAmount: parseFloat(originalRequestedAmount),
        confirmedAt: new Date(),
        paymentId: payment.id
      });
      employee.projectEarnings = projectEarnings;
      
      await employee.save();
    }

    // Notify employee with payment details
    const amountDifference = parseFloat(actualAmount) - parseFloat(originalRequestedAmount);
    let notificationMessage = `Your payment for project "${payment.project.name}" has been processed. Amount paid: ${actualAmount} ${payment.currency}.`;
    
    if (amountDifference !== 0) {
      notificationMessage += ` (Requested: ${originalRequestedAmount} ${payment.currency})`;
    }

    await Notification.create({
      userId: payment.employeeId,
      title: 'Payment Processed',
      message: notificationMessage,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
      priority: 'high',
      metadata: {
        requestedAmount: originalRequestedAmount,
        approvedAmount: actualAmount,
        difference: amountDifference
      }
    });

    res.status(200).json({
      success: true,
      message: "Payment approved and processed successfully.",
      payment: {
        ...payment.toJSON(),
        paymentDetails: {
          allocatedAmount: payment.allocatedAmount,
          requestedAmount: originalRequestedAmount,
          approvedAmount: actualAmount,
          actualAmount: actualAmount,
          calculatedActualAmount: payment.calculatedActualAmount,
          difference: amountDifference
        }
      }
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
module.exports = {
  handleGetAllPayments,
  handleGetPaymentById,
  handleGetMyPayments,
  handleRequestPayment,
  handleApprovePaymentRequest,
  handleRejectPaymentRequest,
};
