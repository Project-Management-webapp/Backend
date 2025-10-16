const Payment = require('../../model/paymentModel/payment');
const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const Notification = require('../../model/notificationModel/notification');
const { Op } = require('sequelize');

const handleCreatePayment = async (req, res) => {
  try {
    const {
      employeeId,
      projectId,
      amount,
      paymentType,
      paymentMethod,
      status,
      paymentDate,
      dueDate,
      description,
      transactionId,
      transactionProofLink,
      proofOfPayment,
      currency
    } = req.body;

    const processedBy = req.user.id;

    // Validation: Employee ID, amount, and payment proof are required
    if (!employeeId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and amount are required"
      });
    }

    if (!transactionId && !transactionProofLink && !proofOfPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment proof is required (provide transactionId, transactionProofLink, or proofOfPayment)"
      });
    }

    // Check if employee exists
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if project exists (if projectId provided)
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }
    }

    const newPayment = await Payment.create({
      employeeId,
      projectId,
      amount,
      paymentType: paymentType || 'project_payment',
      paymentMethod: paymentMethod || 'bank_transfer',
      status: status || 'completed',
      requestStatus: 'paid',
      paymentDate: paymentDate || new Date(),
      dueDate,
      description,
      transactionId,
      transactionProofLink,
      proofOfPayment,
      currency: currency || 'USD',
      processedBy,
      approvedBy: processedBy,
      approvedAt: new Date()
    });

    // Create notification for employee
    await Notification.create({
      userId: employeeId,
      title: 'Payment Processed',
      message: `A payment of ${amount} ${currency || 'USD'} has been processed for you. Please confirm receipt.`,
      type: 'payment',
      relatedId: newPayment.id,
      relatedType: 'payment',
      priority: 'high'
    });

    const paymentWithDetails = await Payment.findOne({
      where: { id: newPayment.id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'position']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully with proof. Waiting for employee confirmation.",
      data: paymentWithDetails
    });

  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};;

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
      whereConditions.paymentDate = {
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
          as: 'processor',
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
          as: 'processor',
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

const handleUpdatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      amount,
      paymentType,
      paymentMethod,
      status,
      paymentDate,
      dueDate,
      description,
      transactionId
    } = req.body;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (paymentType !== undefined) updateData.paymentType = paymentType;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (status !== undefined) updateData.status = status;
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (description !== undefined) updateData.description = description;
    if (transactionId !== undefined) updateData.transactionId = transactionId;

    await payment.update(updateData);

    // Notify employee if status changed to completed
    if (status === 'completed' && payment.status !== 'completed') {
      await Notification.create({
        userId: payment.employeeId,
        title: 'Payment Completed',
        message: `Your payment of ${payment.amount} has been processed successfully`,
        type: 'payment',
        relatedId: paymentId,
        relatedType: 'payment',
        priority: 'high'
      });
    }

    const updatedPayment = await Payment.findOne({
      where: { id: paymentId },
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

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: updatedPayment
    });

  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleDeletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    await payment.destroy();

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully"
    });

  } catch (error) {
    console.error("Delete payment error:", error);
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
          as: 'processor',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['paymentDate', 'DESC']]
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

    const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
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

const handleApprovePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes, scheduledDate } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'bankAccountNumber', 'bankName']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'projectCode']
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
    payment.requestStatus = 'approved';
    payment.approvedAt = new Date();
    payment.approvedBy = userId;
    payment.approvalNotes = approvalNotes;
    payment.scheduledDate = scheduledDate || new Date();
    payment.status = 'processing';
    await payment.save();

    // Notify employee
    await Notification.create({
      userId: payment.employeeId,
      title: 'Payment Approved',
      message: `Your payment request of ${payment.amount} ${payment.currency} for project ${payment.project.name} has been approved`,
      type: 'payment',
      relatedId: payment.id,
      relatedType: 'payment',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: "Payment approved successfully. Please upload payment proof after processing.",
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
          attributes: ['id', 'name', 'projectCode', 'createdBy']
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

// Get earnings report (Employee view)


module.exports = {
  handleCreatePayment,
  handleGetAllPayments,
  handleGetPaymentById,
  handleUpdatePayment,
  handleDeletePayment,
  handleGetMyPayments,
  handleGetPaymentsByProject,
  handleRequestPayment,
  handleApprovePaymentRequest,
  handleRejectPaymentRequest,
  handleConfirmPaymentReceived,
  handleGetEarningsReport,
};
