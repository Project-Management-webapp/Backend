const User = require('../userModel/user');
const Project = require('../projectModel/project');
const ProjectAssignment = require('../projectAssignmentModel/projectAssignment');
const Message = require('../messageModel/message');
const Payment = require('../paymentModel/payment');
const Notification = require('../notificationModel/notification');
const SupportTicket = require('../supportTicketModel/supportTicket');



// User and Project associations
User.hasMany(Project, { 
  foreignKey: 'createdBy', 
  as: 'createdProjects' 
});
Project.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});



// User and ProjectAssignment associations (Many-to-Many through ProjectAssignment)
User.hasMany(ProjectAssignment, { 
  foreignKey: 'employeeId', 
  as: 'projectAssignments' 
});
ProjectAssignment.belongsTo(User, { 
  foreignKey: 'employeeId', 
  as: 'employee' 
});

User.hasMany(ProjectAssignment, { 
  foreignKey: 'assignedBy', 
  as: 'assignmentsMade' 
});
ProjectAssignment.belongsTo(User, { 
  foreignKey: 'assignedBy', 
  as: 'assigner' 
});

// Project and ProjectAssignment associations
Project.hasMany(ProjectAssignment, { 
  foreignKey: 'projectId', 
  as: 'assignments' 
});
ProjectAssignment.belongsTo(Project, { 
  foreignKey: 'projectId', 
  as: 'project' 
});

// Many-to-Many relationship between User and Project through ProjectAssignment
User.belongsToMany(Project, { 
  through: ProjectAssignment, 
  foreignKey: 'employeeId', 
  otherKey: 'projectId', 
  as: 'assignedProjects' 
});
Project.belongsToMany(User, { 
  through: ProjectAssignment, 
  foreignKey: 'projectId', 
  otherKey: 'employeeId', 
  as: 'assignedEmployees' 
});

// Message associations
User.hasMany(Message, { 
  foreignKey: 'senderId', 
  as: 'sentMessages' 
});
Message.belongsTo(User, { 
  foreignKey: 'senderId', 
  as: 'sender' 
});

User.hasMany(Message, { 
  foreignKey: 'receiverId', 
  as: 'receivedMessages' 
});
Message.belongsTo(User, { 
  foreignKey: 'receiverId', 
  as: 'receiver' 
});

Project.hasMany(Message, { 
  foreignKey: 'projectId', 
  as: 'messages' 
});
Message.belongsTo(Project, { 
  foreignKey: 'projectId', 
  as: 'project' 
});

// Payment associations
User.hasMany(Payment, { 
  foreignKey: 'employeeId', 
  as: 'receivedPayments' 
});
Payment.belongsTo(User, { 
  foreignKey: 'employeeId', 
  as: 'employee' 
});

User.hasMany(Payment, { 
  foreignKey: 'processedBy', 
  as: 'processedPayments' 
});
Payment.belongsTo(User, { 
  foreignKey: 'processedBy', 
  as: 'processor' 
});

User.hasMany(Payment, { 
  foreignKey: 'approvedBy', 
  as: 'approvedPayments' 
});
Payment.belongsTo(User, { 
  foreignKey: 'approvedBy', 
  as: 'approver' 
});

User.hasMany(Payment, { 
  foreignKey: 'rejectedBy', 
  as: 'rejectedPayments' 
});
Payment.belongsTo(User, { 
  foreignKey: 'rejectedBy', 
  as: 'rejecter' 
});

Project.hasMany(Payment, { 
  foreignKey: 'projectId', 
  as: 'payments' 
});
Payment.belongsTo(Project, { 
  foreignKey: 'projectId', 
  as: 'project' 
});

ProjectAssignment.hasMany(Payment, { 
  foreignKey: 'assignmentId', 
  as: 'payments' 
});
Payment.belongsTo(ProjectAssignment, { 
  foreignKey: 'assignmentId', 
  as: 'assignment' 
});

// Notification associations
User.hasMany(Notification, { 
  foreignKey: 'userId', 
  as: 'notifications' 
});
Notification.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// SupportTicket associations
User.hasMany(SupportTicket, { 
  foreignKey: 'employeeId', 
  as: 'supportTickets' 
});
SupportTicket.belongsTo(User, { 
  foreignKey: 'employeeId', 
  as: 'employee' 
});

User.hasMany(SupportTicket, { 
  foreignKey: 'assignedTo', 
  as: 'assignedTickets' 
});
SupportTicket.belongsTo(User, { 
  foreignKey: 'assignedTo', 
  as: 'assignedToUser' 
});

User.hasMany(SupportTicket, { 
  foreignKey: 'resolvedBy', 
  as: 'resolvedTickets' 
});
SupportTicket.belongsTo(User, { 
  foreignKey: 'resolvedBy', 
  as: 'resolvedByUser' 
});

User.hasMany(SupportTicket, { 
  foreignKey: 'closedBy', 
  as: 'closedTickets' 
});
SupportTicket.belongsTo(User, { 
  foreignKey: 'closedBy', 
  as: 'closedByUser' 
});

Project.hasMany(SupportTicket, { 
  foreignKey: 'relatedProjectId', 
  as: 'supportTickets' 
});
SupportTicket.belongsTo(Project, { 
  foreignKey: 'relatedProjectId', 
  as: 'relatedProject' 
});

Payment.hasMany(SupportTicket, { 
  foreignKey: 'relatedPaymentId', 
  as: 'supportTickets' 
});
SupportTicket.belongsTo(Payment, { 
  foreignKey: 'relatedPaymentId', 
  as: 'relatedPayment' 
});

// ProjectAssignment work verification associations
User.hasMany(ProjectAssignment, { 
  foreignKey: 'workVerifiedBy', 
  as: 'verifiedAssignments' 
});
ProjectAssignment.belongsTo(User, { 
  foreignKey: 'workVerifiedBy', 
  as: 'verifier' 
});
