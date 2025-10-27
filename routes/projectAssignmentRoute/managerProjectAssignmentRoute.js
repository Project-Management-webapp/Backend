const express = require("express");
const {
  handleAssignEmployeeToProject,
  handleGetProjectAssignments,
  handleRemoveEmployeeFromProject,
  handleUpdateAssignmentRole,
} = require("../../controller/projectAssignmentController/projectAssignmentController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();

// Manager/Admin routes for assignment management
router.post(
  "/assign",
  authorizeRoles(["manager"]),
  handleAssignEmployeeToProject
);
router.get(
  "/project/:projectId",
  authorizeRoles(["manager"]),
  handleGetProjectAssignments
);
router.put(
  "/:assignmentId/role",
  authorizeRoles(["manager"]),
  handleUpdateAssignmentRole
);
router.delete(
  "/:assignmentId",
  authorizeRoles(["manager"]),
  handleRemoveEmployeeFromProject
);

module.exports = router;
