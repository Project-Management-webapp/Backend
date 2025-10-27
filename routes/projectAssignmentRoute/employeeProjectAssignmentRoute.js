const express = require("express");
const {
  handleGetProjectTeammates,
  handleGetMyAssignments,
  handleGetMyAssignmentById,
  handleGetOngoingProjects,
  handleGetCompletedProjects,
  handleSubmitWork
} = require("../../controller/projectAssignmentController/projectAssignmentController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();


router.get(
  "/ongoing",
  authorizeRoles(["employee"]),
  handleGetOngoingProjects
);

// Get completed projects (verified work)
router.get(
  "/completed",
  authorizeRoles(["employee"]),
  handleGetCompletedProjects
);


// Get a specific assignment by ID
router.get(
  "/:id",
  authorizeRoles(["employee"]),
  handleGetMyAssignmentById
);

// Get teammates for a project
router.get(
  "/project/:projectId/teammates",
  authorizeRoles(["employee"]),
  handleGetProjectTeammates
);

// Submit work
router.post("/:id/submit-work", authorizeRoles(["employee"]), handleSubmitWork);

module.exports = router;
