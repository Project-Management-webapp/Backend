const express = require("express");
const {
  handleGetProjectTeammates,
  handleAcceptAssignment,
  handleRejectAssignment,
  handleSubmitWork,
  handleGetMyAssignments,
  handleGetMyAssignmentById,
  handleGetPendingAssignments,
} = require("../../controller/projectAssignmentController/projectAssignmentController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();

// Get all my assignments (with optional filters)
router.get(
  "/my-assignments",
  authorizeRoles(["employee"]),
  handleGetMyAssignments
);

// Get only pending assignments
router.get(
  "/pending",
  authorizeRoles(["employee"]),
  handleGetPendingAssignments
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

// Accept assignment
router.post(
  "/:id/accept",
  authorizeRoles(["employee"]),
  handleAcceptAssignment
);

// Reject assignment
router.post(
  "/:id/reject",
  authorizeRoles(["employee"]),
  handleRejectAssignment
);

// Submit work
router.post("/:id/submit-work", authorizeRoles(["employee"]), handleSubmitWork);

module.exports = router;
