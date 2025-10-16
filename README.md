# Project Management Web Application - Backend

## Overview

A comprehensive Node.js backend application for project management with role-based authentication, employee management, and approval workflows. Built with Express.js, Sequelize ORM, and MySQL database.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Email Services](#email-services)
- [Features](#features)
- [Usage Examples](#usage-examples)

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MySQL with Sequelize ORM v6.37.7
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt v6.0.0
- **Email Service**: Nodemailer v7.0.7
- **File Upload**: Multer v2.0.2 with Cloudinary v1.41.3
- **Environment**: dotenv v17.2.3
- **Development**: Nodemon v3.1.10

## Project Structure

```
Backend/
├── server.js                          # Main application entry point
├── package.json                       # Dependencies and scripts
├── .env                              # Environment variables
├── .gitignore                        # Git ignore rules
│
├── cloudinaryServices/               # File upload services
│   └── upload.js
│
├── config/                           # Configuration files
│   ├── nodemailerConfig/
│   │   └── nodemailer.js
│   └── redisConfig/
│       └── redis.js
│
├── controller/                       # Business logic controllers
│   ├── approvalController/
│   │   └── employeeApproval.js
│   ├── messageController/
│   ├── notificationController/
│   ├── paymentController/
│   ├── projectAssignmentController/
│   ├── projectController/
│   ├── taskController/
│   └── userController/
│       ├── commonManaEmp.js          # Common manager-employee functions
│       ├── employeController.js      # Employee-specific functions
│       ├── employeeDetails.js        # Employee details management
│       └── managerController.js      # Manager-specific functions
│
├── emailService/                     # Email template services
│   ├── approvalEmail.js              # Employee approval emails
│   └── authEmail.js                  # Authentication emails
│
├── middleware/                       # Custom middleware
│   ├── authMiddleware.js             # JWT authentication
│   └── roleMiddleware.js             # Role-based authorization
│
├── model/                           # Database models
│   ├── associationModel/
│   │   └── association.js            # Model relationships
│   ├── messageModel/
│   │   └── message.js
│   ├── notificationModel/
│   │   └── notification.js
│   ├── paymentModel/
│   │   └── payment.js
│   ├── projectAssignmentModel/
│   │   └── projectAssignment.js
│   ├── projectModel/
│   │   └── project.js
│   ├── taskModel/
│   │   └── task.js
│   └── userModel/
│       └── user.js                   # Comprehensive user model
│
├── mysqlConnection/                  # Database connection
│   ├── dbConnection.js               # Sequelize configuration
│   └── dbinit.js                     # Database initialization
│
├── routes/                          # API route definitions
│   ├── approvalRoute/
│   │   └── approvalRoute.js
│   ├── messageRoute/
│   ├── notificationRoute/
│   ├── paymentRoute/
│   ├── profileRoute/
│   │   ├── employeeProfile.js
│   │   └── managerProfile.js
│   ├── projectAssignmentRoute/
│   ├── projectRoute/
│   ├── taskRoute/
│   └── userRoute/
│       ├── commonManaEmpRoute.js     # Common auth routes
│       ├── employeeDetail.js         # Employee management routes
│       ├── employeeRoute.js          # Employee auth routes
│       └── managerRoute.js           # Manager auth routes
│
└── services/                        # Utility services
    ├── authServices.js               # JWT token creation
    └── cookieServices.js             # Cookie management
```

## Installation and Setup

### Prerequisites
- Node.js (version 14 or higher)
- MySQL database
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup MySQL database**
   - Create a MySQL database
   - Update database credentials in .env file

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on port 8567 (or the PORT specified in .env file).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8567
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_NAME=project_management_db
DB_USER=your_mysql_username
DB_PASS=your_mysql_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration (Nodemailer)
ADMIN_EMAIL = your email
ADMIN_PASSWORD = your password

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Database Models

### User Model
Comprehensive user model supporting employees, managers, team leads, and admins with 50+ fields including:

**Basic Information**
- employeeId, fullName, email, alternateEmail, password, role

**Professional Information**
- position, department, jobTitle, level, managerId
- joiningDate, contractType, workLocation, workSchedule
- probationEndDate, confirmationDate

**Contact Information**
- phone, alternatePhone, emergencyContactName, emergencyContactPhone
- address, city, state, country, zipCode

**Personal Information**
- dateOfBirth, gender, maritalStatus, nationality, bloodGroup

**Financial Information**
- baseSalary, currency, payrollId, bankAccountNumber, bankName
- taxId, socialSecurityNumber

**Skills & Education**
- skills (JSON), education (JSON), certifications (JSON), languages (JSON)

**Performance & Status**
- performanceRating, lastReviewDate, nextReviewDate
- totalLeaveBalance, usedLeaveBalance, sickLeaveBalance
- status, isApproved, loginAttempts

### Other Models
- **Project**: Project management with status tracking
- **Task**: Task assignment and progress tracking  
- **ProjectAssignment**: User-project relationships
- **Message**: Internal messaging system
- **Notification**: System notifications
- **Payment**: Payment and billing management

## API Endpoints

### Authentication Endpoints

#### Employee Authentication
- `POST /api/auth/employeesignup` - Employee registration (requires manager approval)
- `POST /api/auth/employee/login` - Employee login
- `POST /api/auth/employee/logout` - Employee logout

#### Manager Authentication  
- `POST /api/auth/manager/signup` - Manager registration
- `POST /api/auth/manager/login` - Manager login
- `POST /api/auth/manager/logout` - Manager logout

#### Common Authentication
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:resetToken` - Reset password with token

### Profile Management Endpoints

#### Manager Profile
- `GET /api/user/manager/profile` - Get manager profile
- `PUT /api/user/manager/profile` - Update manager profile (all fields optional)

#### Employee Profile
- `GET /api/user/employee/profile` - Get employee profile  
- `PUT /api/user/employee/profile` - Update employee profile (all fields optional)

### Employee Management Endpoints (Manager Only)

- `GET /api/user/manager/employees` - Get all employees with pagination and filtering
  - Query parameters: `page`, `limit`, `department`, `status`, `isApproved`
- `GET /api/user/manager/employees/:employeeId` - Get specific employee details

### Employee Approval Endpoints

- `GET /api/user/manager/pending` - Get pending employee approvals
- `POST /api/user/manager/approve/:employeeId` - Approve employee registration
- `POST /api/user/manager/reject/:employeeId` - Reject employee registration

### Project Management Endpoints

#### Project CRUD Operations
- `POST /api/projects` - Create new project (Admin/Manager only)
  - Body: `name`, `description`, `startDate`, `deadline`, `budget`, `priority`, `status`
- `GET /api/projects` - Get all projects with filtering and pagination
  - Query parameters: `page`, `limit`, `status`, `priority`, `search`
- `GET /api/projects/stats` - Get project statistics for dashboard
- `GET /api/projects/my-projects` - Get projects assigned to current user (Employee view)
- `GET /api/projects/:projectId` - Get project details by ID
- `PUT /api/projects/:projectId` - Update project (Admin/Manager only)
- `DELETE /api/projects/:projectId` - Delete project (Admin/Manager only)

### Project Assignment Endpoints

#### Employee Assignment to Projects
- `POST /api/project-assignments/assign` - Assign employee to project (Admin/Manager only)
  - Body: `projectId`, `employeeId`, `role`
- `GET /api/project-assignments/project/:projectId` - Get all employees assigned to a project
- `GET /api/project-assignments/employee/:employeeId` - Get all projects assigned to an employee
- `GET /api/project-assignments/project/:projectId/teammates` - Get teammates on same project
- `PUT /api/project-assignments/:assignmentId/role` - Update assignment role (Admin/Manager only)
- `DELETE /api/project-assignments/:assignmentId` - Remove employee from project (Admin/Manager only)

### Task Management Endpoints

#### Task CRUD Operations
- `POST /api/tasks` - Create new task (Admin/Manager only)
  - Body: `title`, `description`, `projectId`, `assignedTo`, `priority`, `status`, `startDate`, `dueDate`, `estimatedHours`
- `GET /api/tasks` - Get all tasks with filtering
  - Query parameters: `page`, `limit`, `projectId`, `status`, `priority`, `assignedTo`
- `GET /api/tasks/my-tasks` - Get tasks assigned to current user
  - Query parameters: `status`, `priority`
- `GET /api/tasks/project/:projectId` - Get all tasks for a specific project
- `GET /api/tasks/:taskId` - Get task details by ID
- `PUT /api/tasks/:taskId` - Update task
  - Employees can only update their own tasks (`status`, `actualHours`)
  - Managers can update all fields
- `DELETE /api/tasks/:taskId` - Delete task (Admin/Manager only)

### Payment Management Endpoints

#### Payment Operations
- `POST /api/payments` - Create payment record (Admin/Manager only)
  - Body: `employeeId`, `projectId`, `amount`, `paymentType`, `paymentMethod`, `status`, `paymentDate`, `dueDate`, `description`, `transactionId`
- `GET /api/payments` - Get all payments with filtering (Admin/Manager only)
  - Query parameters: `page`, `limit`, `employeeId`, `projectId`, `status`, `paymentType`, `startDate`, `endDate`
- `GET /api/payments/stats` - Get payment statistics (Admin/Manager only)
  - Query parameters: `startDate`, `endDate`
- `GET /api/payments/my-payments` - Get payments for current user (Employee view)
  - Query parameters: `status`, `paymentType`
- `GET /api/payments/project/:projectId` - Get all payments for a project
- `GET /api/payments/:paymentId` - Get payment details by ID
- `PUT /api/payments/:paymentId` - Update payment (Admin/Manager only)
- `DELETE /api/payments/:paymentId` - Delete payment (Admin only)

### Message/Communication Endpoints

#### Team Discussions and Comments
- `POST /api/messages` - Send a new message
  - Body: `content`, `receiverId` (for direct), `projectId` (for project), `taskId` (for task), `messageType`, `mentions`
  - Message types: `direct`, `project`, `task`, `announcement`
- `GET /api/messages` - Get messages with filtering
  - Query parameters: `page`, `limit`, `projectId`, `taskId`, `messageType`
- `GET /api/messages/unread-count` - Get unread message count
- `GET /api/messages/conversation/:userId` - Get conversation between current user and another user
- `GET /api/messages/project/:projectId` - Get all messages for a project
- `GET /api/messages/task/:taskId` - Get all messages/comments for a task
- `PUT /api/messages/:messageId/read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete own message

### Notification Endpoints

#### System Notifications
- `GET /api/notifications` - Get all notifications for current user
  - Query parameters: `page`, `limit`, `type`, `isRead`, `priority`
  - Types: `task_assignment`, `project_assignment`, `deadline_reminder`, `payment`, `general`, `system`
- `GET /api/notifications/unread-count` - Get unread notification count
- `POST /api/notifications` - Create notification (Admin/Manager only)
  - Body: `userId`, `title`, `message`, `type`, `priority`, `relatedId`, `relatedType`
- `POST /api/notifications/broadcast` - Send notification to multiple users (Admin/Manager only)
  - Body: `userIds[]`, `title`, `message`, `type`, `priority`
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete notification
- `DELETE /api/notifications/read/all` - Delete all read notifications

### Health Check
- `GET /api/health` - Server health status

## Authentication & Authorization

### JWT Token Authentication
- Tokens are issued upon successful login
- Tokens are stored in HTTP-only cookies for security
- Token expiration is handled automatically
- Protected routes require valid JWT token

### Role-Based Access Control
- **Admin**: Full system access
- **Manager**: Employee management, approvals, full profile access
- **Team Lead**: Limited management capabilities
- **Employee**: Personal profile management, basic system access
- **Intern**: Limited access similar to employee

### Security Features
- Password hashing with bcrypt (12 salt rounds)
- Account lockout after failed login attempts
- JWT token expiration and refresh
- CORS protection with origin validation
- Input validation and sanitization

## Email Services

### Authentication Emails
- **Password Reset**: Secure password reset with token validation
- **Welcome Email**: New user registration confirmation

### Approval Workflow Emails
- **Approval Request**: Sent to managers when employees register
- **Approval Confirmation**: Sent to employees when approved
- **Rejection Notice**: Sent to employees when rejected



## Features

### User Management
- Comprehensive user profiles with 50+ fields
- Role-based access control
- Employee approval workflow
- Profile picture upload via Cloudinary
- Advanced search and filtering

### Authentication System
- Secure JWT-based authentication
- Password reset functionality
- Account lockout protection
- Session management with cookies

### Employee Approval Workflow
1. Employee registers with basic information
2. Approval request sent to manager via email
3. Manager can view, approve, or reject pending requests
4. Email notifications sent to employees on status change
5. Approved employees can access the system

### Profile Management
- Complete profile updates with optional fields
- Separate interfaces for managers and employees
- Field-level permissions based on roles
- Real-time validation and error handling

### Email Integration
- Professional email templates
- Automated email workflows
- SMTP configuration with multiple providers
- Email delivery status tracking


## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Last Updated**: October 11, 2025
**Version**: 1.0.0
**Node.js Version**: 14+ recommended