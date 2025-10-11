const express = require("express");
const {
  handleGetPendingApprovals,
  handleApproveEmployee,
  handleRejectEmployee,
} = require("../../controller/approvalController/employeeApproval");
const router = express.Router();

router.get("/pending", handleGetPendingApprovals);
router.post("/approve/:employeeId", handleApproveEmployee);
router.post("/reject/:employeeId", handleRejectEmployee);

module.exports = router;
