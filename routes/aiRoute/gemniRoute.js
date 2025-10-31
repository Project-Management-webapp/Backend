const express = require("express");
const { improveText } = require("../../controller/aiController/gemni");
const router = express.Router();

router.post("/improve-text", improveText);

module.exports = router;