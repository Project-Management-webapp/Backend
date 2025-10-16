const express = require("express");
const {
  handleGetProjectTeammates,
  handleAcceptAssignment,
  handleRejectAssignment,
  handleSubmitWork,
} = require("../../controller/projectAssignmentController/projectAssignmentController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/project/:projectId/teammates",
  authorizeRoles(["employee"]),
  handleGetProjectTeammates
);
router.post(
  "/:id/accept",
  authorizeRoles(["employee"]),
  handleAcceptAssignment
);
router.post(
  "/:id/reject",
  authorizeRoles(["employee"]),
  handleRejectAssignment
);
router.post("/:id/submit-work", authorizeRoles(["employee"]), handleSubmitWork);

module.exports = router;
