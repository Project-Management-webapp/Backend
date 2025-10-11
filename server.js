require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const initDB = require("./mysqlConnection/dbinit");

const app = express();
const PORT = process.env.PORT || 8567;

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
const { checkForAuthenticationCookie } = require("./middleware/authMiddleware");
const { authorizeRoles } = require("./middleware/roleMiddleware");

app.use("/api/auth", employeeAuthRoutes, managerAuthRoutes, commonAuthRoutes);
app.use(
  "/api/user/manager",
  checkForAuthenticationCookie('token'),
  authorizeRoles(['manager']),
  managerProfileRoutes,
  approvalRoutes,
  employeeDetailRoutes
);
app.use(
  "/api/user/employee",
  checkForAuthenticationCookie('token'),
   authorizeRoles(['employee']),
  employeeProfileRoutes,
  approvalRoutes,
  employeeDetailRoutes
);


app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

initDB(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
