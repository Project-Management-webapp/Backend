require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const initDB = require("./mysqlConnection/dbinit");

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [process.env.FRONTEND_URL];

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
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const employeeAuthRoutes = require("./routes/userRoute/employeeRoute");
const managerAuthRoutes = require("./routes/userRoute/managerRoute");
const commonAuthRoutes = require("./routes/userRoute/commonManaEmpRoute");
const managerProfileRoutes = require("./routes/profileRoute/managerProfile");
const employeeProfileRoutes = require("./routes/profileRoute/employeeProfile");
const approvalRoutes = require("./routes/approvalRoute/approvalRoute");
const employeeDetailRoutes = require("./routes/userRoute/employeeDetail");
const managerProjectRoutes = require("./routes/projectRoute/managerProjectRoute");
const employeeProjectRoutes = require("./routes/projectRoute/employeeProjectRoute");
const managerProjectAssignmentRoutes = require("./routes/projectAssignmentRoute/managerProjectAssignmentRoute");
const employeeProjectAssignmentRoutes = require("./routes/projectAssignmentRoute/employeeProjectAssignmentRoute");
const managerPaymentRoutes = require("./routes/paymentRoute/managerPaymentRoute");
const employeePaymentRoutes = require("./routes/paymentRoute/employeePaymentRoute");
const messageRoutes = require("./routes/messageRoute/messageRoute");
const notificationRoutes = require("./routes/notificationRoute/notificationRoute");
const managerSupportTicketRoutes = require("./routes/supportTicketRoute/managerSupportTicketRoute");
const employeeSupportTicketRoutes = require("./routes/supportTicketRoute/employeeSupportTicketRoute");
const { checkForAuthenticationCookie } = require("./middleware/authMiddleware");

app.use("/api/auth", employeeAuthRoutes, managerAuthRoutes, commonAuthRoutes);

app.use(
  "/api/user/manager",
  checkForAuthenticationCookie("token"),
  managerProfileRoutes,
  approvalRoutes,
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
  managerProjectAssignmentRoutes
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

initDB(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
