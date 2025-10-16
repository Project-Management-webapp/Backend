const SupportTicket = require('../../model/supportTicketModel/supportTicket');
const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const Payment = require('../../model/paymentModel/payment');
const Notification = require('../../model/notificationModel/notification');
const { Op } = require('sequelize');

// Generate unique ticket ID
const generateTicketId = async () => {
  const count = await SupportTicket.count();
  return `TICKET-${String(count + 1).padStart(5, '0')}`;
};

// Create a new support ticket
async function handleCreateTicket(req, res) {
  try {
    const employeeId = req.user.id;
    const {
      subject,
      description,
      category,
      priority,
      attachments,
      relatedProjectId,
      relatedPaymentId
    } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    // Generate unique ticket ID
    const ticketId = await generateTicketId();

    // Create ticket
    const ticket = await SupportTicket.create({
      ticketId,
      employeeId,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      attachments,
      relatedProjectId,
      relatedPaymentId,
      status: 'open',
    });

    // Notify all admins and managers
    const adminsAndManagers = await User.findAll({
      where: {
        role: { [Op.in]: ['admin', 'manager'] },
        isActive: true,
      }
    });

    const notifications = adminsAndManagers.map(user => ({
      userId: user.id,
      title: 'New Support Ticket',
      message: `New ticket ${ticketId}: ${subject}`,
      type: 'system',
      relatedId: ticket.id,
      relatedType: 'ticket',
      priority: priority || 'medium',
    }));

    await Notification.bulkCreate(notifications);

    // Fetch complete ticket with relations
    const createdTicket = await SupportTicket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId', 'profileImage']
        },
        {
          model: Project,
          as: 'relatedProject',
          attributes: ['id', 'name', 'projectCode']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: createdTicket,
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
}

// Get my tickets (employee view)
async function handleGetMyTickets(req, res) {
  try {
    const employeeId = req.user.id;
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10
    } = req.query;

    const whereClause = { employeeId };

    if (status) {
      whereClause.status = status;
    }
    if (category) {
      whereClause.category = category;
    }
    if (priority) {
      whereClause.priority = priority;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'fullName', 'email', 'role', 'profileImage']
        },
        {
          model: User,
          as: 'resolvedByUser',
          attributes: ['id', 'fullName', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      tickets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
}

// Get all tickets (admin/manager view)
async function handleGetAllTickets(req, res) {
  try {
    // Only admin and manager can access
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and managers can view all tickets'
      });
    }

    const {
      status,
      category,
      priority,
      assignedTo,
      employeeId,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }
    if (category) {
      whereClause.category = category;
    }
    if (priority) {
      whereClause.priority = priority;
    }
    if (assignedTo) {
      whereClause.assignedTo = assignedTo;
    }
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    if (search) {
      whereClause[Op.or] = [
        { ticketId: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId', 'profileImage', 'department']
        },
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'fullName', 'email', 'role', 'profileImage']
        },
        {
          model: Project,
          as: 'relatedProject',
          attributes: ['id', 'name', 'projectCode']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });

    // Statistics
    const stats = {
      total: count,
      open: await SupportTicket.count({ where: { status: 'open' } }),
      inProgress: await SupportTicket.count({ where: { status: 'in_progress' } }),
      resolved: await SupportTicket.count({ where: { status: 'resolved' } }),
      closed: await SupportTicket.count({ where: { status: 'closed' } }),
    };

    res.json({
      success: true,
      tickets,
      stats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
}

// Get ticket by ID
async function handleGetTicketById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId', 'profileImage', 'phone', 'department']
        },
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'fullName', 'email', 'role', 'profileImage']
        },
        {
          model: User,
          as: 'resolvedByUser',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: User,
          as: 'closedByUser',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Project,
          as: 'relatedProject',
          attributes: ['id', 'name', 'projectCode', 'status']
        },
        {
          model: Payment,
          as: 'relatedPayment',
          attributes: ['id', 'amount', 'paymentType', 'status']
        }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check authorization
    if (!['admin', 'manager'].includes(userRole) && ticket.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
}

// Assign ticket to admin/manager
async function handleAssignTicket(req, res) {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Only admin and manager can assign
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const ticket = await SupportTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Verify assignee is admin or manager
    const assignee = await User.findByPk(assignedTo);
    if (!assignee || !['admin', 'manager'].includes(assignee.role)) {
      return res.status(400).json({
        success: false,
        message: 'Can only assign to admin or manager'
      });
    }

    ticket.assignedTo = assignedTo;
    ticket.status = 'in_progress';
    await ticket.save();

    // Notify assignee
    await Notification.create({
      userId: assignedTo,
      title: 'Ticket Assigned',
      message: `You have been assigned ticket ${ticket.ticketId}: ${ticket.subject}`,
      type: 'system',
      relatedId: ticket.id,
      relatedType: 'ticket',
      priority: ticket.priority,
    });

    // Notify employee
    await Notification.create({
      userId: ticket.employeeId,
      title: 'Ticket Update',
      message: `Your ticket ${ticket.ticketId} has been assigned to ${assignee.fullName}`,
      type: 'system',
      relatedId: ticket.id,
      relatedType: 'ticket',
    });

    const updatedTicket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'fullName', 'email', 'role', 'profileImage']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
}

// Add response to ticket
async function handleAddResponse(req, res) {
  try {
    const { id } = req.params;
    const { message, isInternal } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await SupportTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check authorization
    if (!['admin', 'manager'].includes(userRole) && ticket.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'fullName', 'role', 'profileImage']
    });

    const response = {
      userId,
      userName: user.fullName,
      userRole: user.role,
      message,
      isInternal: isInternal || false,
      timestamp: new Date()
    };

    const responses = ticket.responses || [];
    responses.push(response);

    ticket.responses = responses;
    ticket.lastResponseAt = new Date();
    await ticket.save();

    // Notify relevant parties
    if (!isInternal) {
      // If response is from staff, notify employee
      if (['admin', 'manager'].includes(userRole)) {
        await Notification.create({
          userId: ticket.employeeId,
          title: 'New Response to Your Ticket',
          message: `${user.fullName} responded to ticket ${ticket.ticketId}`,
          type: 'system',
          relatedId: ticket.id,
          relatedType: 'ticket',
        });
      }
      // If response is from employee, notify assigned staff
      else if (ticket.assignedTo) {
        await Notification.create({
          userId: ticket.assignedTo,
          title: 'New Ticket Response',
          message: `${user.fullName} responded to ticket ${ticket.ticketId}`,
          type: 'system',
          relatedId: ticket.id,
          relatedType: 'ticket',
        });
      }
    }

    res.json({
      success: true,
      message: 'Response added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message
    });
  }
}

// Update ticket status/resolution
async function handleUpdateTicket(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await SupportTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check authorization
    if (!['admin', 'manager'].includes(userRole) && ticket.employeeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      status,
      priority,
      category,
      resolution,
      internalNotes,
      satisfactionRating,
      satisfactionFeedback
    } = req.body;

    // Employee can only update satisfaction rating
    if (userRole === 'employee' && ticket.employeeId === userId) {
      if (satisfactionRating !== undefined) {
        ticket.satisfactionRating = satisfactionRating;
        ticket.satisfactionFeedback = satisfactionFeedback;
      }
    }
    // Admin/Manager can update all fields
    else if (['admin', 'manager'].includes(userRole)) {
      if (status) {
        ticket.status = status;
        
        if (status === 'resolved') {
          ticket.resolvedAt = new Date();
          ticket.resolvedBy = userId;
          if (resolution) ticket.resolution = resolution;

          // Notify employee
          await Notification.create({
            userId: ticket.employeeId,
            title: 'Ticket Resolved',
            message: `Your ticket ${ticket.ticketId} has been resolved`,
            type: 'system',
            relatedId: ticket.id,
            relatedType: 'ticket',
          });
        } else if (status === 'closed') {
          ticket.closedAt = new Date();
          ticket.closedBy = userId;
        }
      }

      if (priority) ticket.priority = priority;
      if (category) ticket.category = category;
      if (resolution) ticket.resolution = resolution;
      if (internalNotes) ticket.internalNotes = internalNotes;
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'fullName', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
}

// Close ticket
async function handleCloseTicket(req, res) {
  try {
    const { id } = req.params;

    // Only admin and manager can close tickets
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const ticket = await SupportTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closedBy = req.user.id;
    await ticket.save();

    // Notify employee
    await Notification.create({
      userId: ticket.employeeId,
      title: 'Ticket Closed',
      message: `Your ticket ${ticket.ticketId} has been closed`,
      type: 'system',
      relatedId: ticket.id,
      relatedType: 'ticket',
    });

    res.json({
      success: true,
      message: 'Ticket closed successfully',
      ticket
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket',
      error: error.message
    });
  }
}

// Reopen ticket
async function handleReopenTicket(req, res) {
  try {
    const { id } = req.params;
    const { reopenReason } = req.body;
    const userId = req.user.id;

    const ticket = await SupportTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Only employee who created ticket or admin/manager can reopen
    if (ticket.employeeId !== userId && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    ticket.status = 'reopened';
    ticket.reopenedAt = new Date();
    ticket.reopenReason = reopenReason;
    await ticket.save();

    // Notify assigned staff
    if (ticket.assignedTo) {
      await Notification.create({
        userId: ticket.assignedTo,
        title: 'Ticket Reopened',
        message: `Ticket ${ticket.ticketId} has been reopened`,
        type: 'system',
        relatedId: ticket.id,
        relatedType: 'ticket',
        priority: 'high',
      });
    }

    res.json({
      success: true,
      message: 'Ticket reopened successfully',
      ticket
    });
  } catch (error) {
    console.error('Error reopening ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reopen ticket',
      error: error.message
    });
  }
}

module.exports = {
  handleCreateTicket,
  handleGetMyTickets,
  handleGetAllTickets,
  handleGetTicketById,
  handleAssignTicket,
  handleAddResponse,
  handleUpdateTicket,
  handleCloseTicket,
  handleReopenTicket,
};
