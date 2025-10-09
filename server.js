require("dotenv").config();
const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const initDB = require("./mysqlConnection/dbinit");


const app = express();
const PORT = process.env.PORT || 8100;

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
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

initDB(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
