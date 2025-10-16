const express = require("express");
const {
  handleGetMyProjects,
  handleGetProjectById,
} = require("../../controller/projectController/projectController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get("/my-projects", authorizeRoles(["employee"]), handleGetMyProjects);
router.get("/:projectId", authorizeRoles(["employee"]), handleGetProjectById);

module.exports = router;
