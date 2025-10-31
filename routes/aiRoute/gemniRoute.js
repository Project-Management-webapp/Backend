const express = require("express");
const { improveText } = require("../../controller/aiController/gemni");
const router = express.Router();

// Improve text grammar and make it professional
router.post("/improve-text", improveText);

module.exports = router;