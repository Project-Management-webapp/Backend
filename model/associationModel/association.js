const User = require('../userModel/user');
const Project = require('../projectModel/project');
const Task = require('../taskModel/task');
const ProjectAssignment = require('../projectAssignmentModel/projectAssignment');
const Message = require('../messageModel/message');
const Payment = require('../paymentModel/payment');
const Notification = require('../notificationModel/notification');

// Manager-Employee relationship (Self-referencing)
User.hasMany(User, { 
  foreignKey: 'managerId', 
  as: 'subordinates' 
});
User.belongsTo(User, { 
  foreignKey: 'managerId', 
  as: 'manager' 
});

// User and Project associations
User.hasMany(Project, { 
  foreignKey: 'createdBy', 
  as: 'createdProjects' 
});
Project.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// User and Task associations
User.hasMany(Task, { 
  foreignKey: 'assignedTo', 
  as: 'assignedTasks' 
});
Task.belongsTo(User, { 
  foreignKey: 'assignedTo', 
  as: 'assignee' 
});

User.hasMany(Task, { 
  foreignKey: 'createdBy', 
  as: 'createdTasks' 
});
Task.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

// Project and Task associations
Project.hasMany(Task, { 
  foreignKey: 'projectId', 
  as: 'tasks' 
});
Task.belongsTo(Project, { 
  foreignKey: 'projectId', 
  as: 'project' 
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

Task.hasMany(Message, { 
  foreignKey: 'taskId', 
  as: 'messages' 
});
Message.belongsTo(Task, { 
  foreignKey: 'taskId', 
  as: 'task' 
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

Project.hasMany(Payment, { 
  foreignKey: 'projectId', 
  as: 'payments' 
});
Payment.belongsTo(Project, { 
  foreignKey: 'projectId', 
  as: 'project' 
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

