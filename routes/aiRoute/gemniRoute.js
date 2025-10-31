const express = require("express");
const { improveText } = require("../../controller/aiController/gemni");
const router = express.Router();
//hello
router.post("/improve-text", improveText);

module.exports = router;