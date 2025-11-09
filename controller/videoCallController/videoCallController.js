// Video Call Controller for WebRTC signaling
const { ProjectAssignment } = require('../../model/projectAssignmentModel/projectAssignment');
const { User } = require('../../model/userModel/user');
const { Project } = require('../../model/projectModel/project');

// Get all participants for a project (employees and managers)
const getProjectParticipants = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project details
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get all assigned employees
    const assignments = await ProjectAssignment.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'profileImage']
        }
      ]
    });

    const employees = assignments.map(assignment => ({
      id: assignment.employee.id,
      name: assignment.employee.name,
      email: assignment.employee.email,
      profileImage: assignment.employee.profileImage,
      role: 'employee'
    }));

    // Get manager details
    const manager = await User.findByPk(project.managerId, {
      attributes: ['id', 'name', 'email', 'profileImage']
    });

    const participants = [];
    
    if (manager) {
      participants.push({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        profileImage: manager.profileImage,
        role: 'manager'
      });
    }

    participants.push(...employees);

    res.status(200).json({
      success: true,
      data: {
        projectId,
        projectName: project.projectName,
        participants
      }
    });
  } catch (error) {
    console.error('Error getting project participants:', error);
    res.status(500).json({ success: false, message: 'Failed to get project participants' });
  }
};

module.exports = {
  getProjectParticipants
};
