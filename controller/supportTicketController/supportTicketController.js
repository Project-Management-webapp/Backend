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
    } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    // Handle file attachments from Cloudinary upload
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: file.path, // Cloudinary URL
        type: file.mimetype,
        size: file.size,
        cloudinaryId: file.filename
      }));
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
      attachments: attachments.length > 0 ? attachments : null,
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
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: createdTicket,
      attachmentsCount: attachments.length
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

    const tickets = await SupportTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'fullName', 'email', 'role', 'profileImage']
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      tickets,
      total: tickets.count,
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
      employeeId,
      search,
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

    const  tickets = await SupportTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId', 'profileImage', 'department']
        },

      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],

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
      total: tickets.count,
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


// Add response to ticket
async function handleAddResponse(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;
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

    // Handle file attachments from Cloudinary upload
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: file.path, // Cloudinary URL
        type: file.mimetype,
        size: file.size,
        cloudinaryId: file.filename
      }));
    }

    const response = {
      userId,
      userName: user.fullName,
      userRole: user.role,
      message,
      attachments: attachments.length > 0 ? attachments : null,
      timestamp: new Date()
    };

    const responses = ticket.responses || [];
    responses.push(response);

    ticket.responses = responses;
    ticket.lastResponseAt = new Date();
    await ticket.save();

  
    res.json({
      success: true,
      message: 'Response added successfully',
      ticket,
      attachmentsCount: attachments.length
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
      status
    } = req.body;


    // Admin/Manager can update all fields
    if (['admin', 'manager'].includes(userRole)) {
      if (status) {
        ticket.status = status;
        
        if (status === 'resolved') {
          ticket.resolvedAt = new Date();
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
        }
      }
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email']
        },
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




module.exports = {
  handleCreateTicket,
  handleGetMyTickets,
  handleGetAllTickets,
  handleGetTicketById,
  handleAddResponse,
  handleUpdateTicket,
};
