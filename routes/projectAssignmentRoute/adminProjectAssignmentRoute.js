const express = require("express");
const {
  handleToggleAssignmentStatus,
} = require("../../controller/projectAssignmentController/projectAssignmentController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();


router.patch(
  "/:id/toggle-status",
  authorizeRoles(["admin","manager"]),
  handleToggleAssignmentStatus
);

module.exports = router;
