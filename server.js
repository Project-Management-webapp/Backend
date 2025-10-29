require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const initDB = require("./mysqlConnection/dbinit");
const milestoneReminderJob = require("./jobs/milestoneReminderJob");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

const allowedOrigins = [process.env.FRONTEND_URL];

// CORS configuration for Express
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Middleware to attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const employeeAuthRoutes = require("./routes/userRoute/employeeRoute");
const managerAuthRoutes = require("./routes/userRoute/managerRoute");
const commonAuthRoutes = require("./routes/userRoute/commonManaEmpRoute");
const managerProfileRoutes = require("./routes/profileRoute/managerProfile");
const employeeProfileRoutes = require("./routes/profileRoute/employeeProfile");
const employeeDetailRoutes = require("./routes/userRoute/employeeDetail");
const managerProjectRoutes = require("./routes/projectRoute/managerProjectRoute");
const employeeProjectRoutes = require("./routes/projectRoute/employeeProjectRoute");
const managerProjectAssignmentRoutes = require("./routes/projectAssignmentRoute/managerProjectAssignmentRoute");
const employeeProjectAssignmentRoutes = require("./routes/projectAssignmentRoute/employeeProjectAssignmentRoute");
const adminProjectAssignmentRoutes = require("./routes/projectAssignmentRoute/adminProjectAssignmentRoute");
const managerPaymentRoutes = require("./routes/paymentRoute/managerPaymentRoute");
const employeePaymentRoutes = require("./routes/paymentRoute/employeePaymentRoute");
const messageRoutes = require("./routes/messageRoute/messageRoute");
const notificationRoutes = require("./routes/notificationRoute/notificationRoute");
const managerSupportTicketRoutes = require("./routes/supportTicketRoute/managerSupportTicketRoute");
const employeeSupportTicketRoutes = require("./routes/supportTicketRoute/employeeSupportTicketRoute");
const employeeStatsRoutes = require("./routes/statsRoute/employeeStatsRoute");
const managerStatsRoutes = require("./routes/statsRoute/managerStatsRoute");
const managerFinanceRoutes = require("./routes/financeRoute/managerFinanceRoute");
const { checkForAuthenticationCookie } = require("./middleware/authMiddleware");

app.use("/api/auth", employeeAuthRoutes, managerAuthRoutes, commonAuthRoutes);

app.use(
  "/api/user/manager",
  checkForAuthenticationCookie("token"),
  managerProfileRoutes,
  employeeDetailRoutes
);

app.use(
  "/api/user/employee",
  checkForAuthenticationCookie("token"),
  employeeProfileRoutes
);

// Manager/Admin Project Routes
app.use(
  "/api/manager/projects",
  checkForAuthenticationCookie("token"),
  managerProjectRoutes
);

// Employee Project Routes
app.use(
  "/api/employee/projects",
  checkForAuthenticationCookie("token"),
  employeeProjectRoutes
);

// Manager/Admin Project Assignment Routes
app.use(
  "/api/manager/project-assignments",
  checkForAuthenticationCookie("token"),
  managerProjectAssignmentRoutes,
  adminProjectAssignmentRoutes
);

// Employee Project Assignment Routes
app.use(
  "/api/employee/project-assignments",
  checkForAuthenticationCookie("token"),
  employeeProjectAssignmentRoutes
);



// Manager/Admin Payment Routes
app.use(
  "/api/manager/payments",
  checkForAuthenticationCookie("token"),
  managerPaymentRoutes
);

// Employee Payment Routes
app.use(
  "/api/employee/payments",
  checkForAuthenticationCookie("token"),
  employeePaymentRoutes
);

app.use("/api/messages", checkForAuthenticationCookie("token"), messageRoutes);
app.use(
  "/api/notifications",
  checkForAuthenticationCookie("token"),
  notificationRoutes
);

// Manager/Admin Support Ticket Routes
app.use(
  "/api/manager/support-tickets",
  checkForAuthenticationCookie("token"),
  managerSupportTicketRoutes
);

// Employee Support Ticket Routes
app.use(
  "/api/employee/support-tickets",
  checkForAuthenticationCookie("token"),
  employeeSupportTicketRoutes
);

// Employee Statistics Routes
app.use(
  "/api/employee/stats",
  checkForAuthenticationCookie("token"),
  employeeStatsRoutes
);

// Manager Statistics Routes
app.use(
  "/api/manager/stats",
  checkForAuthenticationCookie("token"),
  managerStatsRoutes
);

// Manager Finance Routes
app.use(
  "/api/manager/finance",
  checkForAuthenticationCookie("token"),
  managerFinanceRoutes
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join a project room
  socket.on('join_project', (projectId) => {
    // Ensure projectId is consistently a string
    const projectIdStr = String(projectId);
    const roomName = `project_${projectIdStr}`;
    socket.join(roomName);
    console.log(`📍 User ${socket.id} joined project room: ${roomName}`);
    
    // Log current rooms for this socket
    console.log('Current rooms for socket:', Array.from(socket.rooms));
    
    // Get all clients in this room
    const roomClients = io.sockets.adapter.rooms.get(roomName);
    console.log(`👥 Total clients in ${roomName}:`, roomClients ? roomClients.size : 0);
    
    // Notify others in the room that someone joined
    socket.to(roomName).emit('user_joined_room', { 
      socketId: socket.id,
      projectId: projectIdStr,
      timestamp: new Date().toISOString()
    });
  });

  // Leave a project room
  socket.on('leave_project', (projectId) => {
    const projectIdStr = String(projectId);
    const roomName = `project_${projectIdStr}`;
    socket.leave(roomName);
    console.log(`👋 User ${socket.id} left project room: ${roomName}`);
    
    // Get remaining clients
    const roomClients = io.sockets.adapter.rooms.get(roomName);
    console.log(`👥 Remaining clients in ${roomName}:`, roomClients ? roomClients.size : 0);
  });

  // User is typing
  socket.on('typing', ({ projectId, userName }) => {
    const projectIdStr = String(projectId);
    const roomName = `project_${projectIdStr}`;
    console.log(`⌨️ ${userName} is typing in ${roomName}`);
    socket.to(roomName).emit('user_typing', { userName });
  });

  // User stopped typing
  socket.on('stop_typing', ({ projectId }) => {
    const projectIdStr = String(projectId);
    const roomName = `project_${projectIdStr}`;
    socket.to(roomName).emit('user_stop_typing');
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

initDB(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO is ready for real-time connections`);
    milestoneReminderJob.start();
    console.log(' Milestone reminder cron job started (runs daily at 9:00 AM)');
  });
});
 