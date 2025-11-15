const User = require("../userModel/user");
const Project = require("../projectModel/project");
const ProjectAssignment = require("../projectAssignmentModel/projectAssignment");
const Message = require("../messageModel/message");
const Payment = require("../paymentModel/payment");
const Notification = require("../notificationModel/notification");
const SupportTicket = require("../supportTicketModel/supportTicket");

// User self-referential association (for manager-employee relationship)
User.hasMany(User, {
  foreignKey: "createdBy",
  as: "createdUsers",
  onDelete: "SET NULL",
});
User.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// User approval association
User.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

// User and Project associations
User.hasMany(Project, {
  foreignKey: "createdBy",
  as: "createdProjects",
  onDelete: "CASCADE",
});
Project.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// User and ProjectAssignment associations (Many-to-Many through ProjectAssignment)
User.hasMany(ProjectAssignment, {
  foreignKey: "employeeId",
  as: "projectAssignments",
  onDelete: "CASCADE",
});
ProjectAssignment.belongsTo(User, {
  foreignKey: "employeeId",
  as: "employee",
  
});

User.hasMany(ProjectAssignment, {
  foreignKey: "assignedBy",
  as: "assignmentsMade",
  onDelete: "SET NULL",
});
ProjectAssignment.belongsTo(User, {
  foreignKey: "assignedBy",
  as: "assigner",
});

// Project and ProjectAssignment associations
Project.hasMany(ProjectAssignment, {
  foreignKey: "projectId",
  as: "assignments",
  onDelete: "CASCADE",
});
ProjectAssignment.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// Many-to-Many relationship between User and Project through ProjectAssignment
User.belongsToMany(Project, {
  through: ProjectAssignment,
  foreignKey: "employeeId",
  otherKey: "projectId",
  as: "assignedProjects",
});
Project.belongsToMany(User, {
  through: ProjectAssignment,
  foreignKey: "projectId",
  otherKey: "employeeId",
  as: "assignedEmployees",
});

// Message associations
User.hasMany(Message, {
  foreignKey: "senderId",
  as: "sentMessages",
  onDelete: 'CASCADE'
});
Message.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender",
});

User.hasMany(Message, {
  foreignKey: "receiverId",
  as: "receivedMessages",
  onDelete: 'SET NULL'
});
Message.belongsTo(User, {
  foreignKey: "receiverId",
  as: "receiver",
});

Project.hasMany(Message, {
  foreignKey: "projectId",
  as: "messages",
  onDelete: 'CASCADE'
});
Message.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// Message self-referencing associations for replies
Message.hasMany(Message, {
  foreignKey: "replyToMessageId",
  as: "replies",
  onDelete: 'SET NULL'
});
Message.belongsTo(Message, {
  foreignKey: "replyToMessageId",
  as: "parentMessage",
});

// Payment associations
User.hasMany(Payment, {
  foreignKey: "employeeId",
  as: "receivedPayments",
  onDelete: 'CASCADE'
});
Payment.belongsTo(User, {
  foreignKey: "employeeId",
  as: "employee",
});

User.hasMany(Payment, {
  foreignKey: "managerId",
  as: "managedPayments",
  onDelete: 'SET NULL'
});
Payment.belongsTo(User, {
  foreignKey: "managerId",
  as: "manager",
});

User.hasMany(Payment, {
  foreignKey: "rejectedBy",
  as: "rejectedPayments",
  onDelete: 'SET NULL'
});
Payment.belongsTo(User, {
  foreignKey: "rejectedBy",
  as: "rejecter",
});

Project.hasMany(Payment, {
  foreignKey: "projectId",
  as: "payments",
  onDelete: 'CASCADE'
});
Payment.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

ProjectAssignment.hasMany(Payment, {
  foreignKey: "assignmentId",
  as: "payments",
  onDelete: 'CASCADE'
});
Payment.belongsTo(ProjectAssignment, {
  foreignKey: "assignmentId",
  as: "assignment",
});

// Notification associations
User.hasMany(Notification, {
  foreignKey: "userId",
  as: "notifications",
  onDelete: 'CASCADE'
});
Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// SupportTicket associations
User.hasMany(SupportTicket, {
  foreignKey: "employeeId",
  as: "supportTickets",
  onDelete: 'CASCADE'
});
SupportTicket.belongsTo(User, {
  foreignKey: "employeeId",
  as: "employee",
});

User.hasMany(SupportTicket, {
  foreignKey: "assignedTo",
  as: "assignedTickets",
  onDelete: 'SET NULL'
});
SupportTicket.belongsTo(User, {
  foreignKey: "assignedTo",
  as: "assignedToUser",
});

User.hasMany(SupportTicket, {
  foreignKey: "resolvedBy",
  as: "resolvedTickets",
  onDelete: 'SET NULL' 
});
SupportTicket.belongsTo(User, {
  foreignKey: "resolvedBy",
  as: "resolvedByUser",
});

User.hasMany(SupportTicket, {
  foreignKey: "closedBy",
  as: "closedTickets",
  onDelete: 'SET NULL'  // If User is deleted, keep ticket, but nullify user link.
});
SupportTicket.belongsTo(User, {
  foreignKey: "closedBy",
  as: "closedByUser",
});

Project.hasMany(SupportTicket, {
  foreignKey: "relatedProjectId",
  as: "supportTickets",
  onDelete: 'SET NULL'  // If Project is deleted, keep ticket, but nullify project link.
});
SupportTicket.belongsTo(Project, {
  foreignKey: "relatedProjectId",
  as: "relatedProject",
});

Payment.hasMany(SupportTicket, {
  foreignKey: "relatedPaymentId",
  as: "supportTickets",
  onDelete: 'SET NULL' 
});
SupportTicket.belongsTo(Payment, {
  foreignKey: "relatedPaymentId",
  as: "relatedPayment",
});

// ProjectAssignment work verification associations
User.hasMany(ProjectAssignment, {
  foreignKey: "workVerifiedBy",
  as: "verifiedAssignments",
  onDelete: 'SET NULL' 
});
ProjectAssignment.belongsTo(User, {
  foreignKey: "workVerifiedBy",
  as: "verifier",
});
