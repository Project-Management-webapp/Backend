# Project Management Web Application - Backend

## Overview

A comprehensive enterprise-grade Node.js backend application for project management with role-based authentication, employee management, financial tracking, milestone reminders, and approval workflows. Built with Express.js, Sequelize ORM, MySQL database, and automated cron jobs.

## 🚀 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Email Services](#email-services)
- [Automated Jobs](#automated-jobs)
- [Features](#features)
- [Architecture Diagrams](#architecture-diagrams)
- [Usage Examples](#usage-examples)

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MySQL with Sequelize ORM v6.37.7
- **Authentication**: JWT (JSON Web Tokens) with bcrypt v6.0.0
- **Email Service**: Nodemailer v7.0.7
- **File Upload**: Multer v2.0.2 with Cloudinary v1.41.3
- **Scheduled Jobs**: node-cron v3.0.3
- **Environment**: dotenv v17.2.3
- **Development**: Nodemon v3.1.10

## Project Structure

```
Backend/
├── server.js                          # Main application entry point with cron job initialization
├── package.json                       # Dependencies and scripts
├── .env                              # Environment variables (gitignored)
├── .gitignore                        # Git ignore rules
│
├── cloudinaryServices/               # Cloud file upload services
│   └── upload.js                     # Cloudinary integration for profile images
│
├── config/                           # Configuration files
│   ├── nodemailerConfig/
│   │   └── nodemailer.js            # Email service configuration
│   └── redisConfig/
│       └── redis.js                 # Redis cache configuration (optional)
│
├── controller/                       # Business logic controllers
│   ├── financeController/
│   │   └── financeController.js     # Financial overview, profit/loss, income summary
│   ├── messageController/
│   │   └── messageController.js     # Team communication and messaging
│   ├── notificationController/
│   │   └── notificationController.js # System notifications management
│   ├── paymentController/
│   │   └── paymentController.js     # Payment requests, approvals, tracking
│   ├── projectAssignmentController/
│   │   └── projectAssignmentController.js # Employee-project assignments, work submission
│   ├── projectController/
│   │   └── projectController.js     # Project CRUD, milestones, financials
│   ├── statsController/
│   │   ├── employeeStatsController.js   # Employee dashboard statistics
│   │   └── managerStatsController.js    # Manager dashboard statistics
│   ├── supportTicketController/
│   │   └── supportTicketController.js   # Support ticket management
│   └── userController/
│       ├── commonManaEmp.js         # Common manager-employee functions
│       ├── employeController.js     # Employee authentication
│       ├── employeeDetails.js       # Employee details management
│       └── managerController.js     # Manager authentication
│
├── emailService/                     # Email template services
│   ├── approvalEmail.js             # Employee approval emails
│   ├── authEmail.js                 # Authentication emails (password reset)
│   └── milestoneEmail.js            # Milestone reminder emails
│
├── jobs/                            # Automated background jobs
│   ├── milestoneReminderJob.js      # Daily cron job for milestone reminders
│   ├── testMilestoneReminder.js     # Manual test script for milestone job
│   └── README_MILESTONE_CRON.md     # Milestone cron job documentation
│
├── middleware/                       # Custom middleware
│   ├── authMiddleware.js            # JWT authentication middleware
│   └── roleMiddleware.js            # Role-based authorization middleware
│
├── model/                           # Sequelize database models
│   ├── associationModel/
│   │   └── association.js           # Model relationships and associations
│   ├── messageModel/
│   │   └── message.js               # Team messages and communications
│   ├── notificationModel/
│   │   └── notification.js          # System notifications
│   ├── paymentModel/
│   │   └── payment.js               # Payment tracking with request workflow
│   ├── projectAssignmentModel/
│   │   └── projectAssignment.js     # Employee assignments with work status
│   ├── projectModel/
│   │   └── project.js               # Projects with milestones, consumables, financials
│   ├── supportTicketModel/
│   │   └── supportTicket.js         # Support tickets
│   └── userModel/
│       └── user.js                  # Users with earnings tracking
│
├── mysqlConnection/                  # Database connection setup
│   ├── dbConnection.js              # Sequelize instance configuration
│   └── dbinit.js                    # Database initialization and sync
│
├── routes/                          # API route definitions
│   ├── financeRoute/
│   │   └── managerFinanceRoute.js   # Finance overview and profit/loss routes
│   ├── messageRoute/
│   │   └── messageRoute.js          # Messaging routes
│   ├── notificationRoute/
│   │   └── notificationRoute.js     # Notification routes
│   ├── paymentRoute/
│   │   ├── employeePaymentRoute.js  # Employee payment routes
│   │   └── managerPaymentRoute.js   # Manager payment routes
│   ├── profileRoute/
│   │   ├── employeeProfile.js       # Employee profile routes
│   │   └── managerProfile.js        # Manager profile routes
│   ├── projectAssignmentRoute/
│   │   ├── adminProjectAssignmentRoute.js    # Admin assignment routes
│   │   ├── employeeProjectAssignmentRoute.js # Employee assignment routes
│   │   └── managerProjectAssignmentRoute.js  # Manager assignment routes
│   ├── projectRoute/
│   │   ├── employeeProjectRoute.js  # Employee project routes
│   │   └── managerProjectRoute.js   # Manager project routes
│   ├── statsRoute/
│   │   ├── employeeStatsRoute.js    # Employee statistics routes
│   │   └── managerStatsRoute.js     # Manager statistics routes
│   ├── supportTicketRoute/
│   │   ├── employeeSupportTicketRoute.js  # Employee ticket routes
│   │   └── managerSupportTicketRoute.js   # Manager ticket routes
│   └── userRoute/
│       ├── commonManaEmpRoute.js    # Common authentication routes
│       ├── employeeDetail.js        # Employee management routes
│       ├── employeeRoute.js         # Employee authentication routes
│       └── managerRoute.js          # Manager authentication routes
│
└── services/                        # Utility services
    ├── authServices.js              # JWT token creation and validation
    └── cookieServices.js            # HTTP cookie management
```
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
- Node.js (version 14 or higher recommended)
- MySQL database (version 5.7 or higher)
- npm or yarn package manager
- SMTP email service (Gmail, SendGrid, etc.)
- Cloudinary account (for file uploads)

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
   # Edit .env with your configuration (see Environment Variables section)
   ```

4. **Setup MySQL database**
   - Create a MySQL database
   - Update database credentials in .env file
   - Database tables will be created automatically on first run

5. **Start the application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify installation**
   - Server will start on configured PORT (default: 8000)
   - Check health endpoint: `GET http://localhost:8000/api/health`
   - Check console for: "✅ Milestone reminder cron job started"

The server will automatically:
- Connect to MySQL database
- Sync all database models
- Start the milestone reminder cron job
- Listen for incoming requests

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_NAME=project_management_db
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_characters
JWT_EXPIRE=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration (Nodemailer - Gmail example)
ADMIN_EMAIL=your-email@gmail.com
ADMIN_PASSWORD=your-app-specific-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cron Job Configuration (Optional - defaults provided)
CRON_TIMEZONE=Asia/Kolkata
```

### Email Setup Notes
For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `ADMIN_PASSWORD`

## Database Models

### 📊 Core Models

### 📊 Core Models

#### 1. **User Model** (`model/userModel/user.js`)
Comprehensive user model supporting employees, managers, team leads, and admins with 60+ fields:

**Basic Information**
- `employeeId`, `fullName`, `email`, `alternateEmail`, `password`, `role`
- Roles: `admin`, `manager`, `team_lead`, `employee`, `intern`

**Professional Information**
- `position`, `department`, `jobTitle`, `level`, `managerId`
- `joiningDate`, `contractType`, `workLocation`, `workSchedule`

**Contact & Personal**
- `phone`, `emergencyContactName`, `emergencyContactPhone`
- `address`, `city`, `state`, `country`, `zipCode`
- `dateOfBirth`, `gender`, `maritalStatus`, `nationality`

**Financial & Earnings**
- `baseSalary`, `currency`, `bankAccountNumber`, `bankName`
- **`totalEarnings`** - Total confirmed earnings from all projects
- **`projectEarnings`** (JSON) - Array of project-based earnings with payment history
- **`pendingEarnings`** - Amount in payment requests (not yet confirmed)

**Skills & Performance**
- `skills` (JSON), `education` (JSON), `certifications` (JSON)
- `performanceRating`, `lastReviewDate`, `nextReviewDate`

**Account Status**
- `status`, `isApproved`, `isActive`, `loginAttempts`
- `profileImage`, `bio`

#### 2. **Project Model** (`model/projectModel/project.js`)
Projects with financial tracking and milestone management:

**Basic Information**
- `name`, `description`, `status`, `priority`
- **`projectType`**: ENUM(`'quoted'`, `'time and materials'`, `'other'`)
- **`customProjectType`**: String (when projectType is 'other')

**Timeline & Tracking**
- `startDate`, `deadline`, `actualStartDate`, `actualEndDate`
- **`estimatedHours`**, **`actualHours`** - Hour tracking for cost calculation
- **`estimatedConsumables`** (JSON) - Array of estimated materials/supplies costs
- **`actualConsumables`** (JSON) - Array of actual materials/supplies costs used

**Financial Information**
- **`budget`** - Total project budget
- **`allocatedAmount`** - Amount allocated to employees
- **`spentAmount`** - Total amount spent on project
- `currency`, `billingType` (fixed_price, hourly, monthly_retainer, etc.)

**Client Information**
- `companyName`, `companyEmail`, `companyPhone`

**Project Management**
- **`milestones`** (JSON) - Array of milestones with:
  ```json
  {
    "name": "Milestone Name",
    "description": "Description",
    "deadline": "2025-11-15",
    "status": "pending|in_progress|completed"
  }
  ```
- `referenceLinks` (JSON), `risks` (JSON), `issues` (JSON)
- `testingStatus`, `notes`

**Team Information**
- `teamSize`, `teamLead`, `visibility`, `createdBy`

#### 3. **ProjectAssignment Model** (`model/projectAssignmentModel/projectAssignment.js`)
Employee assignments to projects with work tracking:

**Assignment Details**
- `projectId`, `employeeId`, `role`, `assignedBy`, `assignedDate`
- `isActive` - Soft delete flag

**Payment Allocation**
- **`allocatedAmount`** - Amount allocated to this employee from project budget
- `currency`, `paymentTerms`, `paymentSchedule`

**Work Submission & Verification**
- **`workStatus`**: ENUM(`'not_started'`, `'in_progress'`, `'submitted'`)
- `workStartedAt`, `workSubmittedAt`
- `deliverables` (JSON) - Expected deliverables
- `actualDeliverables` (JSON) - Submitted work with links

#### 4. **Payment Model** (`model/paymentModel/payment.js`)
Payment tracking with request-approval workflow:

**Payment Information**
- `employeeId`, `projectId`, `assignmentId`
- `amount`, `currency`, `paymentType`, `paymentMethod`

**Payment Request Workflow**
- **`requestStatus`**: ENUM(`'requested'`, `'rejected'`, `'paid'`)
- `requestedAt`, `requestedBy`, `requestNotes`
- `rejectedAt`, `rejectedBy`, `rejectedReason`
- `approvedAt`, `managerId`, `approvalNotes`
- `transactionId`, `transactionProofLink`

**Status**
- `status`: ENUM(`'pending'`, `'completed'`, `'cancelled'`, `'on_hold'`)

#### 5. **Notification Model** (`model/notificationModel/notification.js`)
System notifications with metadata:

- `userId`, `title`, `message`, `type`, `priority`
- `relatedId`, `relatedType` - Link to related resource
- `metadata` (JSON) - Additional contextual data
- `isRead`, `readAt`

#### 6. **Message Model** (`model/messageModel/message.js`)
Team communication and messaging

#### 7. **SupportTicket Model** (`model/supportTicketModel/supportTicket.js`)
Support ticket management system

### 🔗 Model Associations

Defined in `model/associationModel/association.js`:

```javascript
// User relationships
User.hasMany(Project, { foreignKey: 'createdBy', as: 'createdProjects' })
User.hasMany(ProjectAssignment, { foreignKey: 'employeeId', as: 'assignments' })
User.hasMany(Payment, { foreignKey: 'employeeId', as: 'payments' })

// Project relationships
Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })
Project.hasMany(ProjectAssignment, { foreignKey: 'projectId', as: 'assignments' })
Project.hasMany(Payment, { foreignKey: 'projectId', as: 'payments' })

// Assignment relationships
ProjectAssignment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' })
ProjectAssignment.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' })
ProjectAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' })

// Payment relationships
Payment.belongsTo(User, { foreignKey: 'employeeId', as: 'employee' })
Payment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' })
Payment.belongsTo(User, { foreignKey: 'managerId', as: 'manager' })
```

## API Endpoints

### 🔐 Authentication Endpoints

#### Employee Authentication
- **POST** `/api/auth/employeesignup` - Employee registration
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "1234567890",
    "position": "Developer"
  }
  ```
  ✅ Creates account in pending state (requires manager approval)

- **POST** `/api/auth/employee/login` - Employee login
- **POST** `/api/auth/employee/logout` - Employee logout

#### Manager Authentication  
- **POST** `/api/auth/manager/signup` - Manager registration
- **POST** `/api/auth/manager/login` - Manager login
- **POST** `/api/auth/manager/logout` - Manager logout

#### Password Recovery
- **POST** `/api/auth/forgot-password` - Request password reset
- **POST** `/api/auth/reset-password/:resetToken` - Reset password with token

---

### 👤 Profile Management

#### Manager Profile
- **GET** `/api/user/manager/profile` - Get manager profile
- **PUT** `/api/user/manager/profile` - Update manager profile

#### Employee Profile
- **GET** `/api/user/employee/profile` - Get employee profile  
- **PUT** `/api/user/employee/profile` - Update employee profile

---

### 👥 Employee Management (Manager Only)

- **GET** `/api/user/manager/employees` - Get all employees
  - Query: `page`, `limit`, `department`, `status`, `isApproved`
- **GET** `/api/user/manager/employees/:employeeId` - Get employee details
- **GET** `/api/user/manager/pending` - Get pending approvals
- **POST** `/api/user/manager/approve/:employeeId` - Approve employee
- **POST** `/api/user/manager/reject/:employeeId` - Reject employee

---

### 📁 Project Management

#### Manager/Admin Routes (`/api/manager/projects`)
- **POST** `/` - Create new project
  ```json
  {
    "name": "E-commerce Platform",
    "description": "Full-stack e-commerce solution",
    "projectType": "quoted",
    "startDate": "2025-11-01",
    "deadline": "2026-03-15",
    "budget": 50000,
    "estimatedHours": 500,
    "estimatedConsumables": [
      {"name": "Cloud hosting", "quantity": 6, "cost": 300},
      {"name": "SSL certificates", "quantity": 1, "cost": 100}
    ],
    "milestones": [
      {
        "name": "UI/UX Design Complete",
        "description": "Finalize design and wireframes",
        "deadline": "2025-11-15",
        "status": "pending"
      }
    ],
    "status": "pending",
    "priority": "high"
  }
  ```

- **GET** `/` - Get all projects (with filters)
- **GET** `/:id` - Get project by ID
- **PUT** `/:id` - Update project
- **DELETE** `/:id` - Delete project
- **GET** `/stats/summary` - Get project statistics

#### Employee Routes (`/api/employee/projects`)
- **GET** `/my-projects` - Get assigned projects
- **GET** `/:id` - View project details

---

### 👷 Project Assignments

#### Manager Routes (`/api/manager/project-assignments`)
- **POST** `/assign` - Assign employee to project
  ```json
  {
    "projectId": 1,
    "employeeId": 5,
    "role": "Frontend Developer",
    "allocatedAmount": 5000,
    "paymentSchedule": "project_completion",
    "deliverables": ["Login page", "Dashboard", "Settings"]
  }
  ```

- **GET** `/project/:projectId` - Get project assignments
- **PUT** `/:assignmentId/role` - Update assignment role
- **DELETE** `/:assignmentId` - Remove employee from project
- **PUT** `/:id/toggle-status` - Enable/disable assignment

#### Employee Routes (`/api/employee/project-assignments`)
- **GET** `/my-assignments` - Get my assignments
- **GET** `/ongoing` - Get ongoing projects
- **GET** `/:id` - Get assignment details
- **PUT** `/:id/submit-work` - Submit completed work
  ```json
  {
    "actualDeliverables": [
      {
        "name": "Login Page",
        "url": "https://github.com/repo/pull/123",
        "submittedAt": "2025-10-28"
      }
    ]
  }
  ```

- **GET** `/project/:projectId/teammates` - Get teammates

---

### 💰 Payment Management

#### Employee Routes (`/api/employee/payments`)
- **POST** `/request` - Request payment
  ```json
  {
    "assignmentId": 10,
    "requestNotes": "Completed all deliverables for Phase 1"
  }
  ```
  ✅ Creates payment request, updates `pendingEarnings`

- **GET** `/my-payments` - Get my payments
- **GET** `/:id` - Get payment details

#### Manager Routes (`/api/manager/payments`)
- **GET** `/` - Get all payments (with filters)
- **GET** `/:id` - Get payment details
- **PUT** `/:id/approve` - Approve payment
  ```json
  {
    "approvalNotes": "Approved after review",
    "transactionId": "TXN123456789",
    "transactionProofLink": "https://bank.com/proof/123"
  }
  ```
  ✅ Updates payment status, employee `totalEarnings`, and `projectEarnings` array

- **PUT** `/:id/reject` - Reject payment
  ```json
  {
    "rejectedReason": "Deliverables incomplete"
  }
  ```

---

### 💵 Finance Management (Manager Only)

Routes: `/api/manager/finance`

- **GET** `/overview` - Financial overview
  ```json
  {
    "summary": {
      "totalProjects": 15,
      "totalBudget": 500000,
      "totalAllocatedToEmployees": 250000,
      "totalPaidToEmployees": 150000,
      "totalPendingPayments": 50000,
      "overallProfitLoss": 100000,
      "overallProfitLossPercentage": "20.00"
    },
    "projects": [/* project financials */]
  }
  ```

- **GET** `/projects/:projectId/profit-loss` - Project profit/loss calculation
  ```json
  {
    "project": {
      "id": 1,
      "name": "E-commerce Platform",
      "budget": 50000
    },
    "estimated": {
      "hours": { "quantity": 500, "rate": 50, "cost": 25000 },
      "consumables": { "totalCost": 400 },
      "employeeAllocations": 15000,
      "totalCost": 40400,
      "profitLoss": 9600,
      "profitMargin": "19.20"
    },
    "actual": {
      "hours": { "quantity": 480, "cost": 24000 },
      "consumables": { "totalCost": 380 },
      "employeePayments": 12000,
      "totalCost": 36380,
      "profitLoss": 13620,
      "profitMargin": "27.24"
    },
    "variance": {
      "hours": -1000,
      "consumables": -20,
      "total": -4020
    }
  }
  ```

- **GET** `/income-summary` - Overall income summary
  - Query: `startDate`, `endDate`, `projectType`, `status`

- **GET** `/employee-allocations` - Track allocated amounts to employees

---

### 📊 Statistics & Analytics

#### Employee Stats (`/api/employee/stats`)
- **GET** `/dashboard` - Employee dashboard overview
- **GET** `/earnings-over-time` - Earnings chart data
- **GET** `/assignment-distribution` - Project distribution
- **GET** `/payment-distribution` - Payment status breakdown
- **GET** `/activity-summary` - Recent activity

#### Manager Stats (`/api/manager/stats`)
- **GET** `/dashboard` - Manager dashboard overview
- **GET** `/project-distribution` - Projects by status/type
- **GET** `/team-performance` - Top performing employees
- **GET** `/budget-utilization` - Budget tracking per project
- **GET** `/payment-queue` - Pending payment approvals
- **GET** `/workload-distribution` - Employee workload

---

### 🔔 Notifications

Routes: `/api/notifications`

- **GET** `/` - Get all notifications (with filters)
- **GET** `/unread-count` - Get unread count
- **PUT** `/:id/read` - Mark as read
- **PUT** `/mark-all-read` - Mark all as read
- **DELETE** `/:id` - Delete notification

---

### 💬 Messages

Routes: `/api/messages`

- **POST** `/` - Send message
- **GET** `/` - Get messages (with filters)
- **GET** `/unread-count` - Unread message count
- **GET** `/conversation/:userId` - Get conversation
- **PUT** `/:id/read` - Mark as read

---

### 🎫 Support Tickets

#### Employee Routes (`/api/employee/support-tickets`)
- **POST** `/` - Create ticket
- **GET** `/my-tickets` - Get my tickets
- **PUT** `/:id` - Update ticket

#### Manager Routes (`/api/manager/support-tickets`)
- **GET** `/` - Get all tickets
- **PUT** `/:id/assign` - Assign ticket
- **PUT** `/:id/resolve` - Resolve ticket

---

### ❤️ Health Check
- **GET** `/api/health` - Server health status

## Authentication & Authorization

### JWT Token Authentication
- Tokens issued upon successful login
- Stored in HTTP-only cookies (secure, httpOnly, sameSite)
- Token expiration: 7 days (configurable)
- Auto-refresh mechanism on protected routes
- Logout clears cookie and invalidates token

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, all endpoints |
| **Manager** | Create projects, approve employees, approve payments, view financials, manage team |
| **Team Lead** | Limited management, view team data |
| **Employee** | View assigned projects, submit work, request payments, view own data |
| **Intern** | Similar to employee with restricted access |

### Middleware Stack
```javascript
// Authentication check
checkForAuthenticationCookie('token')

// Role verification
verifyManagerOrAdmin  // Manager or Admin only
authorizeRoles(['admin', 'manager'])  // Specific roles
```

### Security Features
- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Account lockout after 5 failed login attempts
- ✅ JWT token expiration and validation
- ✅ CORS protection with origin whitelist
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection
- ✅ HTTP-only cookies

## 📧 Email Services

The system uses Nodemailer with SMTP for professional email communications:

### 1. **Authentication Emails** (`emailService/authEmail.js`)

**Password Reset Emails**
```javascript
sendPasswordResetEmail(email, resetToken, userName)
```
- Secure password reset link with time-limited token
- Professional HTML template with branding
- Token expires in 1 hour

**Welcome Email**
```javascript
sendWelcomeEmail(email, userName)
```
- New user registration confirmation
- Account activation instructions

### 2. **Approval Workflow Emails** (`emailService/approvalEmail.js`)

**Approval Request to Manager**
```javascript
sendApprovalRequestEmail(managerEmail, employeeName, employeeDetails)
```
- Notifies manager of pending employee registration
- Includes employee details for review
- Direct action links

**Approval Confirmation to Employee**
```javascript
sendApprovalEmail(employeeEmail, employeeName, managerName)
```
- Confirms account approval
- Login credentials and next steps

**Rejection Notice to Employee**
```javascript
sendRejectionEmail(employeeEmail, employeeName, reason)
```
- Informs employee of rejection
- Optional reason for rejection
- Reapplication instructions

### 3. **Milestone Reminder Emails** (`emailService/milestoneEmail.js`)

**Milestone Deadline Reminders**
```javascript
sendMilestoneReminderEmail(recipients, milestone, project, urgency, assignedEmployees)
```

**Features:**
- 🎨 **Beautiful HTML Design**: Gradient header, professional styling
- ⚠️ **Urgency Indicators**: 
  - Red banner for TODAY deadlines
  - Orange banner for TOMORROW deadlines
- 👥 **Role-Specific Content**:
  - Employees: "Ensure you're on track to meet the deadline"
  - Managers: Shows count of assigned employees
- 📋 **Milestone Card**: Project name, milestone details, deadline countdown
- 🔘 **Action Buttons**: Quick access to view project

**Email Triggers:**
- Automatically sent daily at 9:00 AM via cron job
- Checks milestones due today or tomorrow
- Sends to assigned employees + project creator

### Email Configuration

All emails use environment variables:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Project Management System <noreply@pm.com>"
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password (Google Account > Security)
3. Use App Password in `EMAIL_PASS`

---

## ⏰ Automated Jobs

### Milestone Reminder Cron Job

**Location:** `jobs/milestoneReminderJob.js`

**Schedule:** Daily at 9:00 AM (configurable via `CRON_TIMEZONE`)

**Cron Pattern:** `0 9 * * *`

**What It Does:**
1. ✅ Fetches all active projects with milestones
2. ✅ Checks for projects with assigned employees
3. ✅ Iterates through each milestone in the project
4. ✅ Identifies milestones due **today** or **tomorrow**
5. ✅ Creates notifications for employees and managers
6. ✅ Sends professional email reminders
7. ✅ Logs all operations for monitoring

**Notification Logic:**
```javascript
// TODAY deadline
{
  priority: 'urgent',
  type: 'milestone_reminder',
  title: '⚠️ Milestone Due TODAY',
  message: `The milestone "${milestoneName}" for project "${projectName}" is due TODAY!`
}

// TOMORROW deadline
{
  priority: 'high',
  type: 'milestone_reminder',
  title: '⏰ Milestone Due Tomorrow',
  message: `The milestone "${milestoneName}" for project "${projectName}" is due tomorrow.`
}
```

**Email Recipients:**
- All assigned employees on the project
- Project creator/manager

**Configuration:**
```env
CRON_TIMEZONE=America/New_York  # Set your timezone
```

### Testing the Cron Job

**Manual Test Script:** `jobs/testMilestoneReminder.js`

Run manual test:
```bash
node jobs/testMilestoneReminder.js
```

**Console Output:**
```
🔍 Checking project: E-commerce Platform
   📅 Milestone: UI/UX Design Complete
      ⏰ Deadline: 2025-11-15 (TODAY)
      ✅ Created notification for user 5
      📧 Sent email to john@example.com
```

**Automatic Startup:**
The cron job starts automatically when the server initializes:
```javascript
// server.js
initDB()
  .then(() => {
    milestoneReminderJob.start();
    console.log('✅ Milestone reminder cron job started');
  });
```

**Verify Startup:**
Look for this message in server logs:
```
✅ Database connection established
✅ Milestone reminder cron job started
🚀 Server is running on port 5000
```

---

## 🏗️ Architecture & System Flows

### Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  (React/Vue/Mobile App - Frontend Application)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS Requests
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (Node.js)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                       │  │
│  │  • CORS Handler                                          │  │
│  │  • Cookie Parser                                         │  │
│  │  • JSON Body Parser                                      │  │
│  │  • Authentication Middleware (checkForAuthenticationCookie)││
│  │  • Role Middleware (verifyManagerOrAdmin, authorizeRoles)│  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     ROUTES LAYER                          │  │
│  │  /api/auth/*               - Authentication              │  │
│  │  /api/user/*               - User management             │  │
│  │  /api/manager/projects/*   - Project management          │  │
│  │  /api/manager/finance/*    - Financial tracking          │  │
│  │  /api/employee/*           - Employee operations         │  │
│  │  /api/notifications/*      - Notifications               │  │
│  │  /api/messages/*           - Messaging                   │  │
│  │  /api/manager/stats/*      - Manager analytics           │  │
│  │  /api/employee/stats/*     - Employee analytics          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   CONTROLLER LAYER                        │  │
│  │  • Authentication Controller  • Project Controller       │  │
│  │  • Payment Controller        • Finance Controller        │  │
│  │  • Stats Controller          • Notification Controller   │  │
│  │  • Message Controller        • Support Ticket Controller │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     MODEL LAYER (ORM)                     │  │
│  │  Sequelize Models:                                        │  │
│  │  • User        • Project         • ProjectAssignment     │  │
│  │  • Payment     • Notification    • Message               │  │
│  │  • SupportTicket                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
│  MySQL Database (Sequelize ORM)                                 │
│  • users • projects • project_assignments • payments            │
│  • notifications • messages • support_tickets                   │
└─────────────────────────────────────────────────────────────────┘

       EXTERNAL SERVICES
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │  Nodemailer │  │  Cloudinary │  │    Redis    │
       │   (SMTP)    │  │ (File Upload)│  │   (Cache)   │
       └─────────────┘  └─────────────┘  └─────────────┘

       BACKGROUND JOBS
       ┌──────────────────────────────────┐
       │  Cron Jobs (node-cron)           │
       │  • Milestone Reminder (9 AM)     │
       └──────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐                                   ┌────────────┐
│  Client  │                                   │   Server   │
└────┬─────┘                                   └─────┬──────┘
     │                                               │
     │  1. POST /api/auth/employee/login             │
     │  { email, password }                          │
     ├──────────────────────────────────────────────>│
     │                                               │
     │                                          2. Verify
     │                                          credentials
     │                                          (bcrypt)
     │                                               │
     │                                          3. Generate
     │                                          JWT token
     │                                               │
     │  4. Set HTTP-only cookie + user data          │
     │<──────────────────────────────────────────────┤
     │                                               │
     │  5. Subsequent requests with cookie           │
     ├──────────────────────────────────────────────>│
     │                                               │
     │                                          6. Verify JWT
     │                                          from cookie
     │                                               │
     │  7. Protected resource data                   │
     │<──────────────────────────────────────────────┤
     │                                               │
     │  8. POST /api/auth/employee/logout            │
     ├──────────────────────────────────────────────>│
     │                                               │
     │                                          9. Clear cookie
     │                                               │
     │  10. Success response                         │
     │<──────────────────────────────────────────────┤
     │                                               │
```

### Payment Approval Flow with Earnings Update

```
┌──────────┐        ┌─────────┐        ┌──────────────┐
│ Employee │        │  Server │        │   Database   │
└────┬─────┘        └────┬────┘        └──────┬───────┘
     │                   │                     │
     │  1. Submit work   │                     │
     │  PUT /api/employee│                     │
     │  /project-assignments/:id/submit-work   │
     ├──────────────────>│                     │
     │                   │  2. Update          │
     │                   │  workStatus         │
     │                   │  to 'submitted'     │
     │                   ├────────────────────>│
     │                   │                     │
     │  3. Request payment                     │
     │  POST /api/employee/payments/request    │
     ├──────────────────>│                     │
     │                   │  4. Create payment  │
     │                   │  record with        │
     │                   │  requestStatus      │
     │                   │  = 'requested'      │
     │                   ├────────────────────>│
     │                   │                     │
     │                   │  5. Update employee │
     │                   │  pendingEarnings   │
     │                   │  += amount          │
     │                   ├────────────────────>│
     │                   │                     │
     │  6. Notification sent                   │
     │<──────────────────┤                     │
     │                   │                     │
                                              
┌─────────┐          ┌─────────┐        ┌──────────────┐
│ Manager │          │  Server │        │   Database   │
└────┬────┘          └────┬────┘        └──────┬───────┘
     │                    │                     │
     │  7. Review payment │                     │
     │  GET /api/manager/ │                     │
     │  payments/:id      │                     │
     ├───────────────────>│                     │
     │                    │  8. Fetch payment   │
     │                    ├────────────────────>│
     │                    │                     │
     │  9. Approve payment│                     │
     │  PUT /api/manager/ │                     │
     │  payments/:id/approve                    │
     ├───────────────────>│                     │
     │                    │  10. Update payment │
     │                    │  requestStatus      │
     │                    │  = 'paid'           │
     │                    ├────────────────────>│
     │                    │                     │
     │                    │  11. Update employee│
     │                    │  totalEarnings     │
     │                    │  += amount          │
     │                    │  pendingEarnings   │
     │                    │  -= amount          │
     │                    │  projectEarnings   │
     │                    │  .push({...})       │
     │                    ├────────────────────>│
     │                    │                     │
     │  12. Confirmation  │                     │
     │<───────────────────┤                     │
     │                    │                     │
     │                    │  13. Email + Notification
     │                    │  to employee        │
     │                    └────────────────────>│
     │                                          │
```

### Milestone Reminder Cron Job Flow

```
┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  Cron Job    │      │   Server    │      │   Database   │
│  (Daily 9AM) │      │             │      │              │
└──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                     │                     │
       │  1. Trigger at 9:00 AM (node-cron)        │
       ├────────────────────>│                     │
       │                     │                     │
       │                     │  2. Fetch all       │
       │                     │  active projects    │
       │                     │  with milestones    │
       │                     ├────────────────────>│
       │                     │                     │
       │                     │  3. Projects data   │
       │                     │<────────────────────┤
       │                     │                     │
       │                     │  For each project:  │
       │                     │  4. Get assigned    │
       │                     │  employees          │
       │                     ├────────────────────>│
       │                     │                     │
       │                     │  5. Assignment data │
       │                     │<────────────────────┤
       │                     │                     │
       │                     │  For each milestone:│
       │                     │  6. Check if        │
       │                     │  deadline is        │
       │                     │  TODAY or TOMORROW  │
       │                     │                     │
       │                     │  If match found:    │
       │                     │  7. Create          │
       │                     │  notification       │
       │                     │  (priority: urgent/ │
       │                     │  high)              │
       │                     ├────────────────────>│
       │                     │                     │
       │                     │  8. Send email      │
       │                     │  (Nodemailer)       │
       │                     │  to employees +     │
       │                     │  manager            │
       │                     └────────> SMTP Server
       │                     │                     │
       │  9. Log completion  │                     │
       │<────────────────────┤                     │
       │  Console: "✅ Checked X projects,         │
       │  sent Y notifications"                    │
       │                                           │
```

### Financial Calculation Flow

```
┌─────────┐           ┌──────────────────┐        ┌──────────┐
│ Manager │           │ Finance Controller│       │ Database │
└────┬────┘           └────────┬──────────┘       └─────┬────┘
     │                          │                        │
     │  GET /api/manager/       │                        │
     │  finance/overview        │                        │
     ├─────────────────────────>│                        │
     │                          │                        │
     │                          │  1. Fetch all projects │
     │                          │  created by manager    │
     │                          ├───────────────────────>│
     │                          │                        │
     │                          │  2. Projects data      │
     │                          │<───────────────────────┤
     │                          │                        │
     │                          │  3. For each project:  │
     │                          │  - Get assignments     │
     │                          ├───────────────────────>│
     │                          │                        │
     │                          │  4. Get payments       │
     │                          ├───────────────────────>│
     │                          │                        │
     │                          │  5. Calculate:         │
     │                          │                        │
     │                          │  Estimated Cost =      │
     │                          │  (estimatedHours * rate)│
     │                          │  + sum(estimatedConsumables)│
     │                          │  + sum(allocatedAmount)│
     │                          │                        │
     │                          │  Actual Cost =         │
     │                          │  (actualHours * rate)  │
     │                          │  + sum(actualConsumables)│
     │                          │  + sum(paid amounts)   │
     │                          │                        │
     │                          │  Profit/Loss =         │
     │                          │  Budget - Actual Cost  │
     │                          │                        │
     │                          │  Profit Margin % =     │
     │                          │  (Profit / Budget)*100 │
     │                          │                        │
     │  6. Return aggregated    │                        │
     │  financial overview      │                        │
     │<─────────────────────────┤                        │
     │  {                       │                        │
     │    totalBudget,          │                        │
     │    totalPaidToEmployees, │                        │
     │    profitLoss,           │                        │
     │    projects: [...]       │                        │
     │  }                       │                        │
     │                          │                        │
```

---

## ✨ Features

### 🔐 Authentication & Security
- ✅ JWT-based authentication with HTTP-only cookies
- ✅ Role-based access control (Admin, Manager, Team Lead, Employee, Intern)
- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ Account lockout after 5 failed login attempts
- ✅ Secure password reset with time-limited tokens
- ✅ CORS protection with origin whitelist
- ✅ XSS and SQL injection prevention

### 👥 User Management
- ✅ Comprehensive user profiles with 60+ fields
- ✅ Employee approval workflow with email notifications
- ✅ Manager dashboard for team oversight
- ✅ Profile picture upload via Cloudinary
- ✅ Advanced search and filtering
- ✅ Department and role-based organization

### 📊 Project Management
- ✅ Create and manage projects with milestones
- ✅ Multiple project types (Quoted, Time & Materials, Custom)
- ✅ Project budgeting and financial tracking
- ✅ Milestone deadline management
- ✅ Risk and issue tracking
- ✅ Team assignment and collaboration
- ✅ Project visibility controls

### 👷 Assignment & Work Management
- ✅ Assign employees to projects with specific roles
- ✅ Track allocated amounts per employee
- ✅ Work submission and verification system
- ✅ Deliverables tracking (expected vs actual)
- ✅ Work status tracking (not_started, in_progress, submitted)
- ✅ Team collaboration features

### 💰 Payment & Earnings System
- ✅ **Payment request workflow**: Employees request, managers approve
- ✅ **Earnings tracking**: Automatic update of totalEarnings on approval
- ✅ **Project-based earnings**: Track earnings per project with payment history
- ✅ **Pending earnings**: Monitor payment requests in progress
- ✅ Payment rejection with reason tracking
- ✅ Transaction proof upload support

### 💵 Financial Management (Manager)
- ✅ **Financial Overview**: Total budget, allocated amounts, profit/loss across all projects
- ✅ **Profit/Loss Calculations**: 
  - Formula: `Budget - (Hours Cost + Consumables + Employee Payments)`
  - Estimated vs Actual vs Projected costs
  - Variance analysis
  - Profit margin percentages
- ✅ **Income Summary**: 
  - Income by project type
  - Income by status
  - Monthly breakdown with date filtering
- ✅ **Employee Allocations**: Track amounts allocated/paid/pending per employee
- ✅ **Budget Utilization**: Monitor spending against budgets

### ⏰ Automated Jobs & Reminders
- ✅ **Milestone Reminder Cron Job**: 
  - Daily execution at 9:00 AM (configurable timezone)
  - Checks milestones due today and tomorrow
  - Automatic notifications to employees and managers
  - Professional HTML email reminders
  - Priority-based alerts (urgent for today, high for tomorrow)
- ✅ **Manual testing script** for cron job validation

### 📧 Email Notifications
- ✅ **Authentication emails**: Password reset, welcome emails
- ✅ **Approval workflow emails**: 
  - Manager approval requests
  - Employee approval/rejection notifications
- ✅ **Milestone reminders**:
  - Beautiful HTML design with gradient headers
  - Urgency indicators (red for today, orange for tomorrow)
  - Role-specific messaging
  - Project and milestone details
  - Action buttons for quick access
- ✅ SMTP integration with multiple provider support

### 🔔 Notifications System
- ✅ Real-time in-app notifications
- ✅ Priority-based notifications (urgent, high, medium, low)
- ✅ Notification types: assignments, deadlines, payments, milestones
- ✅ Unread count tracking
- ✅ Mark as read/unread functionality
- ✅ Bulk operations (mark all read, delete all read)

### 💬 Messaging System
- ✅ Internal team communication
- ✅ Direct messages between users
- ✅ Project-based discussions
- ✅ Unread message tracking
- ✅ Conversation history

### 🎫 Support Ticket System
- ✅ Employee ticket creation
- ✅ Manager ticket assignment
- ✅ Ticket resolution workflow
- ✅ Status tracking

### 📈 Analytics & Statistics
- ✅ **Manager Dashboard**:
  - Project distribution by status/type
  - Team performance metrics
  - Budget utilization tracking
  - Payment queue overview
  - Workload distribution
- ✅ **Employee Dashboard**:
  - Earnings over time charts
  - Assignment distribution
  - Payment status breakdown
  - Activity summary

### ☁️ Cloud Services Integration
- ✅ **Cloudinary**: Profile picture and file uploads
- ✅ **Redis**: Session management and caching
- ✅ **SMTP**: Email delivery with Nodemailer

---

## 🚀 Development & Deployment

### Running in Development Mode

```bash
# Start server with nodemon (auto-restart on changes)
npm run dev
```

### Running in Production Mode

```bash
# Start server normally
npm start
```

### Verifying Cron Jobs

When server starts, you should see:
```
✅ Database connection established
✅ Milestone reminder cron job started
🚀 Server is running on port 5000
```

### Testing Milestone Reminders

Run the manual test script:
```bash
node jobs/testMilestoneReminder.js
```

Output will show:
- Projects being checked
- Milestones matched (today/tomorrow deadlines)
- Notifications created
- Emails sent

---

## 📝 API Documentation

For detailed API documentation with request/response examples, see the **API Endpoints** section above.

**Quick Links:**
- [Authentication](#-authentication-endpoints)
- [Projects](#-project-management)
- [Payments](#-payment-management)
- [Finance](#-finance-management-manager-only)
- [Statistics](#-statistics--analytics)
- [Notifications](#-notifications)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For technical support or feature requests:
- Create an issue in the project repository
- Contact the development team

---

**Last Updated**: 28th October 2025  
**Version**: 2.0.0  
**Node.js Version**: 18+ recommended  
**Database**: MySQL 8.0+

---

## 🔧 Troubleshooting

### Common Issues

**1. Email not sending**
- Verify SMTP credentials in `.env`
- For Gmail: Enable 2FA and use App Password
- Check EMAIL_SERVICE matches your provider

**2. Cron job not running**
- Check console for " Milestone reminder cron job started"
- Verify CRON_TIMEZONE in `.env`
- Test manually: `node jobs/testMilestoneReminder.js`

**3. Database connection issues**
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists (or set AUTO_CREATE_DB=true)

**4. JWT token errors**
- Check JWT_SECRET is set in `.env`
- Verify cookie settings (secure, httpOnly, sameSite)
- Clear browser cookies and re-login

**5. Cloudinary upload fails**
- Verify Cloudinary credentials in `.env`
- Check file size limits
- Ensure proper image format

---



---