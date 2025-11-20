const express = require("express");
const router = express.Router();
const { sendContactToAdmin } = require("../../controller/contactController/contactController");

// Public route - no authentication required
router.post("/contact", sendContactToAdmin);

module.exports = router;
