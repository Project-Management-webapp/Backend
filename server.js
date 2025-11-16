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

const allowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URL2];

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
const gemniRoutes = require("./routes/aiRoute/gemniRoute");
const videoCallRoutes = require("./routes/videoCallRoute/videoCallRoute");
const twoFactorRoutes = require("./routes/twoFactorRoute/twoFactorRoute");
const googleAuthRoutes = require("./routes/googleAuthRoute/googleAuthRoute");
const adminRoutes = require("./routes/adminRoute/adminRoute");
const adminAuthRoutes = require("./routes/adminRoute/adminAuthRoute");

app.use("/api/auth", employeeAuthRoutes, managerAuthRoutes, commonAuthRoutes, adminAuthRoutes);

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
app.use(
  "/api/ai",
  gemniRoutes
);

// Video Call Routes
app.use(
  "/api/video-call",
  checkForAuthenticationCookie("token"),
  videoCallRoutes
);

// Two-Factor Authentication Routes
app.use("/api/2fa", twoFactorRoutes);

// Google Authenticator Routes
app.use("/api/google-auth", googleAuthRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.IO connection handling
// Track online users: { userId: { socketId, userName, userRole } }
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user as online
  socket.on('user_online', ({ userId, userName, userRole }) => {
    onlineUsers.set(userId, { socketId: socket.id, userName, userRole });
    console.log(`🟢 User ${userName} (${userId}) is now online`);
    
    // Broadcast to all clients that this user is online
    io.emit('user_status_changed', { userId, status: 'online', userName });
  });

  // Join a project room
  socket.on('join_project', ({ projectId, userId }) => {
    // Ensure projectId is consistently a string
    const projectIdStr = String(projectId);
    const roomName = `project_${projectIdStr}`;
    socket.join(roomName);
    
    // Store userId with socket for this room
    socket.userId = userId;
    
    console.log(`📍 User ${userId} (${socket.id}) joined project room: ${roomName}`);
    
    // Log current rooms for this socket
    console.log('Current rooms for socket:', Array.from(socket.rooms));
    
    // Get all clients in this room
    const roomClients = io.sockets.adapter.rooms.get(roomName);
    console.log(`👥 Total clients in ${roomName}:`, roomClients ? roomClients.size : 0);
    
    // Notify others in the room that someone joined
    socket.to(roomName).emit('user_joined_room', { 
      socketId: socket.id,
      userId,
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
    
    // Find and remove user from online users
    for (const [userId, userData] of onlineUsers.entries()) {
      if (userData.socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User ${userData.userName} (${userId}) is now offline`);
        
        // Broadcast to all clients that this user is offline
        io.emit('user_status_changed', { userId, status: 'offline', userName: userData.userName });
        break;
      }
    }
  });
  
  // Get online status for specific user
  socket.on('check_user_status', ({ userId }, callback) => {
    const isOnline = onlineUsers.has(userId);
    callback({ userId, status: isOnline ? 'online' : 'offline' });
  });

  // ========== VIDEO CALL EVENTS ==========
  
  // Start video call - notify all project participants
  socket.on('start_video_call', ({ projectId, callerId, callerName, projectName }) => {
    const projectIdStr = String(projectId);
    const roomName = `project_${projectIdStr}`;
    console.log(`📹 ${callerName} started video call in ${roomName}`);
    
    // Notify all participants in the project room
    socket.to(roomName).emit('incoming_video_call', {
      projectId: projectIdStr,
      callerId,
      callerName,
      projectName,
      timestamp: new Date().toISOString()
    });
  });

  // Join video call room
  socket.on('join_video_call', ({ projectId, userId, userName }) => {
    const projectIdStr = String(projectId);
    const videoRoomName = `video_${projectIdStr}`;
    socket.join(videoRoomName);
    console.log(`🎥 ${userName} (${userId}) joined video call: ${videoRoomName}`);
    
    // Notify others in the video call that someone joined
    socket.to(videoRoomName).emit('user_joined_video_call', {
      userId,
      userName,
      socketId: socket.id
    });
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc_offer', ({ offer, to, from, fromName }) => {
    console.log(`📡 WebRTC offer from ${fromName} (${from}) to ${to}`);
    io.to(to).emit('webrtc_offer', { offer, from, fromName });
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc_answer', ({ answer, to, from }) => {
    console.log(`📡 WebRTC answer from ${from} to ${to}`);
    io.to(to).emit('webrtc_answer', { answer, from });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('webrtc_ice_candidate', ({ candidate, to, from }) => {
    console.log(`🧊 ICE candidate from ${from} to ${to}`);
    io.to(to).emit('webrtc_ice_candidate', { candidate, from });
  });

  // Leave video call
  socket.on('leave_video_call', ({ projectId, userId, userName }) => {
    const projectIdStr = String(projectId);
    const videoRoomName = `video_${projectIdStr}`;
    socket.leave(videoRoomName);
    console.log(`👋 ${userName} left video call: ${videoRoomName}`);
    
    // Notify others that user left
    socket.to(videoRoomName).emit('user_left_video_call', { userId, userName });
  });

  // End video call - notify all participants
  socket.on('end_video_call', ({ projectId, userId, userName }) => {
    const projectIdStr = String(projectId);
    const videoRoomName = `video_${projectIdStr}`;
    console.log(`🔴 ${userName} ended video call: ${videoRoomName}`);
    
    // Notify all participants that call has ended
    io.to(videoRoomName).emit('video_call_ended', { userId, userName });
  });

  // Toggle video/audio
  socket.on('toggle_media', ({ projectId, userId, mediaType, enabled }) => {
    const projectIdStr = String(projectId);
    const videoRoomName = `video_${projectIdStr}`;
    
    // Notify others about media state change
    socket.to(videoRoomName).emit('user_media_changed', {
      userId,
      mediaType, // 'video' or 'audio'
      enabled
    });
  });

  // ========== END VIDEO CALL EVENTS ==========
});

initDB(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO is ready for real-time connections with chat and video call`);
    milestoneReminderJob.start();
    console.log(' Milestone reminder cron job started (runs daily at 9:00 AM)');
  });
});
 