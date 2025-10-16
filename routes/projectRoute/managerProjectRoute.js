const express = require("express");
const {
  handleCreateProject,
  handleGetAllProjects,
  handleUpdateProject,
  handleDeleteProject,
} = require("../../controller/projectController/projectController");
const { authorizeRoles } = require("../../middleware/roleMiddleware");

const router = express.Router();

router.post("/", authorizeRoles(["manager"]), handleCreateProject);
router.get("/", authorizeRoles(["manager"]), handleGetAllProjects);
router.put("/:projectId", authorizeRoles(["manager"]), handleUpdateProject);
router.delete("/:projectId", authorizeRoles(["manager"]), handleDeleteProject);

module.exports = router;
