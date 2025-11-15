const SupportTicket = require('../../model/supportTicketModel/supportTicket');
const User = require('../../model/userModel/user');
const Project = require('../../model/projectModel/project');
const ProjectAssignment = require('../../model/projectAssignmentModel/projectAssignment');
const Notification = require('../../model/notificationModel/notification');
const { Op } = require('sequelize');

const generateTicketId = async () => {
  const count = await SupportTicket.count();
  return `TICKET-${String(count + 1).padStart(5, '0')}`;
};

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

    // Get employee name for notification
    const employee = await User.findByPk(employeeId);

    // Notify ALL managers/admins about new ticket (visible to all managers/admins)
    await Notification.create({
      userId: employeeId, // Set employee as primary recipient (though managers will see it)
      title: 'New Support Ticket',
      message: `New ticket ${ticketId} from ${employee.fullName}: ${subject}`,
      type: 'system',
      relatedId: ticket.id,
      relatedType: 'ticket',
      priority: priority || 'medium',
      targetRole: 'all_managers', // Make visible to all managers/admins
      metadata: {
        ticketId,
        employeeId,
        employeeName: employee.fullName,
        category: category || 'other',
        subject
      }
    });

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

async function handleGetAllTickets(req, res) {
  try {
    const managerId = req.user.id; // Get logged-in manager's ID
    const {
      status,
      category,
      priority,
      employeeId,
      search,
    } = req.query;

    const whereClause = {};

    // Get projects created by this manager
    const managerProjects = await Project.findAll({
      where: { createdBy: managerId },
      attributes: ['id']
    });
    const projectIds = managerProjects.map(p => p.id);

    // Get employees assigned to these projects
    const assignments = await ProjectAssignment.findAll({
      where: { 
        projectId: { [Op.in]: projectIds },
        isActive: true
      },
      attributes: ['employeeId']
    });
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];

    // Filter tickets to only show tickets from employees assigned to this manager's projects
    whereClause.employeeId = { [Op.in]: employeeIds };

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

    // Statistics - only for this manager's employees
    const stats = {
      total: tickets.count,
      open: await SupportTicket.count({ where: { ...whereClause, status: 'open' } }),
      inProgress: await SupportTicket.count({ where: { ...whereClause, status: 'in_progress' } }),
      resolved: await SupportTicket.count({ where: { ...whereClause, status: 'resolved' } }),
      closed: await SupportTicket.count({ where: { ...whereClause, status: 'closed' } }),
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


// Add response to ticket (Manager/Admin ONLY)
async function handleAddResponse(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only managers/admins can add responses
    if (!['admin', 'manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can respond to tickets.'
      });
    }

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

    // Get existing responses array (field name is 'response' in model, not 'responses')
    const responses = ticket.response || [];
    responses.push(response);

    // Update ticket with new response (use 'response' field name)
    ticket.response = responses;
    ticket.lastResponseAt = new Date();
    
    // Auto-update status to in_progress if it was open
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    
    await ticket.save();

    // Notify employee about the response
    await Notification.create({
      userId: ticket.employeeId,
      title: 'Support Ticket Response',
      message: `You received a response on ticket ${ticket.ticketId}: ${ticket.subject}`,
      type: 'system',
      relatedId: ticket.id,
      relatedType: 'ticket',
      priority: ticket.priority
    });

    // Fetch updated ticket with employee details
    const updatedTicket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId', 'profileImage']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      ticket: updatedTicket,
      totalResponses: updatedTicket.response ? updatedTicket.response.length : 0,
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

// Update ticket status/resolution (Manager/Admin ONLY)
async function handleUpdateTicket(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only managers/admins can update tickets
    if (!['admin', 'manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can update ticket status.'
      });
    }

    const ticket = await SupportTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
      });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    
    if (status === 'resolved' && oldStatus !== 'resolved') {
      ticket.resolvedAt = new Date();
      // Notify employee
      await Notification.create({
        userId: ticket.employeeId,
        title: 'Ticket Resolved',
        message: `Your ticket ${ticket.ticketId} has been resolved`,
        type: 'system',
        relatedId: ticket.id,
        relatedType: 'ticket',
        priority: 'high'
      });
    } else if (status === 'closed' && oldStatus !== 'closed') {
      ticket.closedAt = new Date();
      // Notify employee
      await Notification.create({
        userId: ticket.employeeId,
        title: 'Ticket Closed',
        message: `Your ticket ${ticket.ticketId} has been closed`,
        type: 'system',
        relatedId: ticket.id,
        relatedType: 'ticket',
      });
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
      message: `Ticket status updated from '${oldStatus}' to '${status}' successfully`,
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
